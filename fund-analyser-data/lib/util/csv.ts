import { Parser as CsvConverter } from 'json2csv'
import * as _ from 'lodash'
import * as properties from '../util/properties'
import * as math from './math'

const lookbacks = properties.get('fund.lookbacks')

const fieldMapping = {
  isin: {
    label: 'ISIN',
    value: 'isin'
  },
  name: {
    label: 'Name',
    value: 'name'
  },
  type: {
    label: 'Type',
    value: 'type'
  },
  shareClass: {
    label: 'Share Class',
    value: 'shareClass'
  },
  frequency: {
    label: 'Pricing Frequency',
    value: 'frequency'
  },
  ocf: {
    label: 'OCF',
    value: (row: any, field: any, data: any) => {
      return toPercentage(row.ocf)
    }
  },
  amc: {
    label: 'AMC',
    value: (row: any, field: any, data: any) => {
      return toPercentage(row.amc)
    }
  },
  entryCharge: {
    label: 'Entry Charge',
    value: (row: any, field: any, data: any) => {
      return toPercentage(row.entryCharge)
    }
  },
  exitCharge: {
    label: 'Exit Charge',
    value: (row: any, field: any, data: any) => {
      return toPercentage(row.exitCharge)
    }
  },
  bidAskSpread: {
    label: 'Bid-Ask Spread',
    value: (row: any, field: any, data: any) => {
      return toPercentage(row.bidAskSpread)
    }
  },
  returns: getReturnsMapping(),
  holdings: {
    label: 'Holdings',
    value: 'holdings'
  },
  asof: {
    label: 'As of date',
    value: 'asof'
  },
  indicators: {
    stability: {
      label: 'Stability',
      value: 'indicators.stability.value'
    }
  }
}

function formatFields (fields: any) {
  return _.map(fields, (f: any) => _.get(fieldMapping, f, f))
}

export function convert (funds: any, headerFields: any) {
  const opts = {
    fields: formatFields(headerFields)
  }
  return new CsvConverter(opts).parse(funds)
}

function toPercentage (v: any) {
  const pc = math.floatToPc(v)
  return _.isString(pc) ? pc : ''
}

function getReturnsMapping () {
  const mapping: {[period: string]: object} = {}
  for (const period of lookbacks) {
    mapping[period] = {
      label: `returns.${period}`,
      value: (row: any, field: any, data: any) => {
        return toPercentage(row.returns[period])
      }
    }
  }
  return mapping
}
