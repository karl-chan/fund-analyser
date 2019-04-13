const json2csv = require('json2csv')
const _ = require('lodash')
const CsvConverter = json2csv.Parser

const math = require('./math')
const properties = require('../util/properties')

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
        value: (row, field, data) => {
            return toPercentage(row.ocf)
        }
    },
    amc: {
        label: 'AMC',
        value: (row, field, data) => {
            return toPercentage(row.amc)
        }
    },
    entryCharge: {
        label: 'Entry Charge',
        value: (row, field, data) => {
            return toPercentage(row.entryCharge)
        }
    },
    exitCharge: {
        label: 'Exit Charge',
        value: (row, field, data) => {
            return toPercentage(row.exitCharge)
        }
    },
    bidAskSpread: {
        label: 'Bid-Ask Spread',
        value: (row, field, data) => {
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

function formatFields (fields) {
    return _.map(fields, f => _.get(fieldMapping, f, f))
}

function convert (funds, headerFields) {
    const opts = {
        fields: formatFields(headerFields)
    }
    return new CsvConverter(opts).parse(funds)
}

function toPercentage (v) {
    const pc = math.floatToPc(v)
    return _.isString(pc) ? pc : ''
}

function getReturnsMapping () {
    const mapping = {}
    for (let period of lookbacks) {
        mapping[period] = {
            label: `returns.${period}`,
            value: (row, field, data) => {
                return toPercentage(row.returns[period])
            }
        }
    }
    return mapping
}

module.exports = {
    convert
}
