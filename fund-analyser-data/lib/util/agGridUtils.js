module.exports = {
    applyRequest,
    addColours
}

const _ = require('lodash')
const moment = require('moment')
const stat = require('./stat')
const properties = require('./properties')

const lookbacks = properties.get('fund.lookbacks')
const extendedLookbacks = lookbacks.concat(['+1D'])

/**
 * Applies ag-grid Server Side Model request params on the incoming list of funds
 * @see https://www.ag-grid.com/javascript-grid-server-side-model/
 * @param {*} funds
 * @param {IServerSideGetRowsRequest} agGridRequest
 */
function applyRequest (funds, agGridRequest) {
    funds = _applyFilter(funds, agGridRequest.filterModel)
    funds = _applySort(funds, agGridRequest.sortModel)

    // simple statistics
    const lastRow = funds.length

    funds = funds.slice(agGridRequest.startRow, agGridRequest.endRow)
    return { funds, lastRow }
}

function _applySort (funds, sortModel) {
    if (!sortModel.length) {
        return funds
    }

    // Move NaN rows to bottom always
    const [nanRows, validFunds] = _.partition(funds, f => {
        const cell = _.get(f, sortModel[0].colId)
        return !cell && cell !== 0
    })
    const cols = sortModel.map(sm => sm.colId)
    const orders = sortModel.map(sm => sm.sort)
    return _.orderBy(validFunds, cols, orders).concat(nanRows)
}

function _applyFilter (funds, filterModel) {
    if (_.isEmpty(filterModel)) {
        return funds
    }

    const parseValues = (fm) => {
        switch (fm.filterType) {
        case 'number':
            return [+fm.filter, +fm.filterTo]
        case 'date':
            return [moment(fm.dateFrom), moment(fm.dateTo)]
        }
    }
    const buildPredicate = (fm, lowerValue, upperValue) => {
        switch (fm.type) {
        case 'equals':
            return x => x === lowerValue
        case 'notEqual':
            return x => x !== lowerValue
        case 'lessThan':
            return x => x < lowerValue
        case 'lessThanOrEqual':
            return x => x <= lowerValue
        case 'greaterThan':
            return x => x > lowerValue
        case 'greaterThanOrEqual':
            return x => x >= lowerValue
        case 'inRange':
            return x => _.min(lowerValue, upperValue) <= x && x <= _.max(lowerValue, upperValue)
        default:
            return x => x
        }
    }

    for (let [colId, fm] of Object.entries(filterModel)) {
        const [lowerValue, upperValue] = parseValues(fm)
        const predicate = buildPredicate(fm, lowerValue, upperValue)
        funds = funds.filter(f => predicate(_.get(f, colId)))
    }
    return funds
}

function addColours (funds) {
    // returns
    for (let period of extendedLookbacks) {
        funds = _colourAroundZero(`returns.${period}`, funds)
    }

    // indicators
    funds = _colourAroundMedian('indicators.stability', funds, 10) // clip upper at stability = 10
    funds = _colourAroundZero('indicators.macd', funds)
    funds = _colourNegative('indicators.mdd', funds)
    for (let period of lookbacks) {
        funds = _colourAroundZero(`indicators.returns.${period}.max`, funds)
        funds = _colourAroundZero(`indicators.returns.${period}.min`, funds)
    }

    return funds
}

// scoring methods
// positive greeen, negative red, white zero
function _colourAroundZero (field, funds) {
    return _colour(field, funds, ({ val, max, min }) => {
        if (val > 0) {
            return val / max
        }
        if (val < 0) {
            return -val / min
        }
        return 0
    })
}

function _colourAroundMedian (field, funds, clipUpper, clipLower) {
    const options = { clipUpper, clipLower }
    return _colour(field, funds, ({ val, max, min, median }) => {
        if (val > median) {
            return Math.min(1.5, (val - median) / (max - median))
        }
        if (val < median) {
            return Math.max(-1.5, (val - median) / (median - min))
        }
        return 0
    }, options)
}

function _colourNegative (field, funds) {
    return _colour(field, funds, ({ val, max }) => -val / max)
}

function _colour (field, funds, scoreFn, options) {
    const max = _.get(options, 'clipUpper') || stat.max(funds.map(row => _.get(row, field)))
    const min = _.get(options, 'clipLower') || stat.min(funds.map(row => _.get(row, field)))
    const median = stat.median(funds.map(row => _.get(row, field)))
    funds.forEach(row => {
        const val = _.get(row, field)
        const score = scoreFn({ row, max, min, median, val })
        _.set(row, `colours.${field}`, score)
    })
    return funds
}
