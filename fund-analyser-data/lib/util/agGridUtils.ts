import * as _ from 'lodash'
import moment from 'moment'
import * as properties from './properties'
import * as stat from './stat'

const lookbacks: string[] = properties.get('fund.lookbacks')

export type ColourFunction<T> = (field: string, rows: T[]) => T[]

interface ColourOptions {
  clipUpper?: number,
  clipLower?: number,
  desc?: boolean
}

type ScoreFunction<T> = ({ row, max, min, median, val }: { row: T, max: number, min: number, median: number, val: number }) => number

/**
 * Applies ag-grid Server Side Model request params on the incoming list of rows
 * @see https://www.ag-grid.com/javascript-grid-server-side-model/
 * @param {*} rows
 * @param {IServerSideGetRowsRequest} agGridRequest
 */
export function applyRequest<T> (rows: T[], agGridRequest: any) {
  rows = _applyFilter(rows, agGridRequest.filterModel)
  rows = _applySort(rows, agGridRequest.sortModel)

  // simple statistics
  const lastRow = rows.length

  rows = rows.slice(agGridRequest.startRow, agGridRequest.endRow)
  return { rows, lastRow }
}

function _applySort<T> (rows: T[], sortModel: any) {
  if (!sortModel.length) {
    return rows
  }

  // Move NaN rows to bottom always
  const columnName = parseColId(sortModel[0].colId)
  const [nanRows, validRows] = _.partition(rows, f => {
    const cell = _.get(f, columnName)
    return !cell && cell !== 0
  })
  const cols = sortModel.map((sm: any) => parseColId(sm.colId))
  const orders = sortModel.map((sm: any) => sm.sort)
  return _.orderBy(validRows, cols, orders).concat(nanRows)
}

function _applyFilter<T> (rows: T[], filterModel: any) {
  if (_.isEmpty(filterModel)) {
    return rows
  }

  const parseValues = (fm: any) => {
    switch (fm.filterType) {
      case 'number':
        return [+fm.filter, +fm.filterTo]
      case 'date':
        return [moment(fm.dateFrom).unix(), moment(fm.dateTo).unix()]
      default:
        throw new Error(`Unsupported filter type: ${fm.filterType}`)
    }
  }
  const buildPredicate = (fm: any, lowerValue: number, upperValue: number) => {
    switch (fm.type) {
      case 'equals':
        return (x: number) => x === lowerValue
      case 'notEqual':
        return (x: number) => x !== lowerValue
      case 'lessThan':
        return (x: number) => x < lowerValue
      case 'lessThanOrEqual':
        return (x: number) => x <= lowerValue
      case 'greaterThan':
        return (x: number) => x > lowerValue
      case 'greaterThanOrEqual':
        return (x: number) => x >= lowerValue
      case 'inRange':
        return (x: number) => _.min([lowerValue, upperValue]) <= x && x <= _.max([lowerValue, upperValue])
      default:
        return (x: number) => x
    }
  }

  for (const [colId, fm] of Object.entries(filterModel)) {
    const columnName = parseColId(colId)
    const [lowerValue, upperValue] = parseValues(fm)
    const predicate = buildPredicate(fm, lowerValue, upperValue)
    rows = rows.filter(f => predicate(_.get(f, columnName)))
  }
  return rows
}

function parseColId (colId: any) {
  return colId.replace(/_\d+$/g, '')
}

export function addColours<T> (rows: T[], colourOptions: {[field: string]: ColourFunction<T>}) {
  // expand template variables
  const expandedOptions: {[field: string]: ColourFunction<T>} = {}
  for (const [field, colourFunc] of Object.entries(colourOptions)) {
    if (field.includes('$lookback')) {
      for (const lookback of lookbacks) {
        expandedOptions[field.replace(/\$lookback/g, lookback)] = colourFunc
      }
    } else {
      expandedOptions[field] = colourFunc
    }
  }

  for (const [field, colourFunc] of Object.entries(expandedOptions)) {
    rows = colourFunc(field, rows)
  }
  return rows
}

// scoring methods
// (inf, 0, -inf) = (green, 0, red)
export function colourAroundZero<T extends object> ({ desc }: {desc?: boolean} = {}): ColourFunction<T> {
  const scoreFunction: ScoreFunction<T> = ({
    val,
    max,
    min
  }) => {
    if (val > 0) {
      return val / max
    }
    if (val < 0) {
      return -val / min
    }
    return 0
  }
  return colour(scoreFunction, { desc })
}

// (inf, clipUpper, median, clipLower, -inf) = (green, green, white, red, red)
export function colourAroundMedian<T extends object> ({ desc, clipUpper, clipLower } : {desc?: boolean, clipUpper ?: number, clipLower?: number} = {}): ColourFunction <T> {
  const scoreFunction: ScoreFunction <T> = ({
    val,
    max,
    min,
    median
  }) => {
    if (val > median) {
      return Math.min(1.5, (val - median) / (max - median))
    }
    if (val < median) {
      return Math.max(-1.5, (val - median) / (median - min))
    }
    return 0
  }
  return colour(scoreFunction, { clipUpper, clipLower, desc })
}

// (inf, 0, -inf) = (white, white, red)
export function colourNegative <T extends object> () :ColourFunction <T> {
  const scoreFunction: ScoreFunction <T> = ({ val, max }) => -val / max
  return colour(scoreFunction)
}

// scoreFn should return number within range -1 (red) to 1 (green).
function colour<T extends object> (scoreFn: ScoreFunction<T>, options?: ColourOptions): ColourFunction<T> {
  return (field: string, rows: T[]) => {
    const max = _.get(options, 'clipUpper') || stat.max(rows.map(row => _.get(row, field)))
    const min = _.get(options, 'clipLower') || stat.min(rows.map(row => _.get(row, field)))
    const sign = options && options.desc ? -1 : 1
    const median = stat.median(rows.map(row => _.get(row, field)))
    rows.forEach(row => {
      const val = _.get(row, field)
      const score = sign * scoreFn({ row, max, min, median, val })
      _.set(row, `colours.${field}`, score)
    })
    return rows
  }
}
