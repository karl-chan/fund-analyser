import * as _ from 'lodash'
import moment from 'moment'
import Fund from '../fund/Fund'
import * as properties from './properties'
import * as stat from './stat'

const lookbacks = properties.get('fund.lookbacks')

export type ColourFunction = (field: string, funds: Fund[], ...args: any[]) => Fund[]

/**
 * Applies ag-grid Server Side Model request params on the incoming list of funds
 * @see https://www.ag-grid.com/javascript-grid-server-side-model/
 * @param {*} funds
 * @param {IServerSideGetRowsRequest} agGridRequest
 */
export function applyRequest (funds: Fund[], agGridRequest: any) {
  funds = _applyFilter(funds, agGridRequest.filterModel)
  funds = _applySort(funds, agGridRequest.sortModel)

  // simple statistics
  const lastRow = funds.length

  funds = funds.slice(agGridRequest.startRow, agGridRequest.endRow)
  return { funds, lastRow }
}

function _applySort (funds: Fund[], sortModel: any) {
  if (!sortModel.length) {
    return funds
  }

  // Move NaN rows to bottom always
  const columnName = parseColId(sortModel[0].colId)
  const [nanRows, validFunds] = _.partition(funds, (f: any) => {
    const cell = _.get(f, columnName)
    return !cell && cell !== 0
  })
  const cols = sortModel.map((sm: any) => parseColId(sm.colId))
  const orders = sortModel.map((sm: any) => sm.sort)
  return _.orderBy(validFunds, cols, orders).concat(nanRows)
}

function _applyFilter (funds: Fund[], filterModel: any) {
  if (_.isEmpty(filterModel)) {
    return funds
  }

  const parseValues = (fm: any) => {
    switch (fm.filterType) {
      case 'number':
        return [+fm.filter, +fm.filterTo]
      case 'date':
        return [moment(fm.dateFrom), moment(fm.dateTo)]
      default:
        throw new Error(`Unsupported filter type: ${fm.filterType}`)
    }
  }
  const buildPredicate = (fm: any, lowerValue: any, upperValue: any) => {
    switch (fm.type) {
      case 'equals':
        return (x: any) => x === lowerValue
      case 'notEqual':
        return (x: any) => x !== lowerValue
      case 'lessThan':
        return (x: any) => x < lowerValue
      case 'lessThanOrEqual':
        return (x: any) => x <= lowerValue
      case 'greaterThan':
        return (x: any) => x > lowerValue
      case 'greaterThanOrEqual':
        return (x: any) => x >= lowerValue
      case 'inRange':
        return (x: any) => _.min([lowerValue, upperValue]) <= x && x <= _.max([lowerValue, upperValue])
      default:
        return (x: any) => x
    }
  }

  for (const [colId, fm] of Object.entries(filterModel)) {
    const columnName = parseColId(colId)
    const [lowerValue, upperValue] = parseValues(fm)
    const predicate = buildPredicate(fm, lowerValue, upperValue)
    funds = funds.filter((f: any) => predicate(_.get(f, columnName)))
  }
  return funds
}

function parseColId (colId: any) {
  return colId.replace(/_\d+$/g, '')
}

export function addColours (iterables: any, colourOptions: any) {
  // expand template variables
  const expandedOptions = Object.entries(colourOptions)
    .flatMap(([k, v]) => {
      if (k.includes('$lookback')) {
        return lookbacks.map((lookback: any) => [k.replace(/\$lookback/g, lookback), v])
      } else {
        return [[k, v]]
      }
    })

  for (const [field, colourFuncArgs] of expandedOptions) {
    const [colourFunc, ...args] = colourFuncArgs
    iterables = colourFunc(field, iterables, ...args)
  }
  return iterables
}

// scoring methods
// (inf, 0, -inf) = (green, 0, red)
export function colourAroundZero (field: string, funds: Fund[]) {
  return _colour(field, funds, ({
    val,
    max,
    min
  }: any) => {
    if (val > 0) {
      return val / max
    }
    if (val < 0) {
      return -val / min
    }
    return 0
  })
}

// (inf, clipUpper, median, clipLower, -inf) = (green, green, white, red, red)
export function colourAroundMedian (field: string, funds: Fund[], clipUpper: number, clipLower: number) {
  const options = { clipUpper, clipLower }
  return _colour(field, funds, ({
    val,
    max,
    min,
    median
  }: any) => {
    if (val > median) {
      return Math.min(1.5, (val - median) / (max - median))
    }
    if (val < median) {
      return Math.max(-1.5, (val - median) / (median - min))
    }
    return 0
  }, options)
}

// (inf, 0, -inf) = (white, white, red)
export function colourNegative (field: string, funds: Fund[]) {
  return _colour(field, funds, ({
    val,
    max
  }: any) => -val / max)
}

type ScoreFunction = ({ row, max, min, median, val }: { row: Fund, max: number, min: number, median: number, val: number }) => number

function _colour (field: string, funds: Fund[], scoreFn: ScoreFunction, options?: any) {
  const max = _.get(options, 'clipUpper') || stat.max(funds.map((row: any) => _.get(row, field)))
  const min = _.get(options, 'clipLower') || stat.min(funds.map((row: any) => _.get(row, field)))
  const median = stat.median(funds.map((row: any) => _.get(row, field)))
  funds.forEach((row: any) => {
    const val = _.get(row, field)
    const score = scoreFn({ row, max, min, median, val })
    _.set(row, `colours.${field}`, score)
  })
  return funds
}
