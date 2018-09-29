module.exports = {
    applyRequest
}

const _ = require('lodash')
const moment = require('moment')

/**
 * Applies ag-grid Server Side Model request params on the incoming list of funds
 * @see https://www.ag-grid.com/javascript-grid-server-side-model/
 * @param {*} funds
 * @param {IServerSideGetRowsRequest} agGridRequest
 */
function applyRequest (funds, agGridRequest) {
    funds = applyFilter(funds, agGridRequest.filterModel)
    funds = applySort(funds, agGridRequest.sortModel)

    // simple statistics
    const lastRow = funds.length

    funds = funds.slice(agGridRequest.startRow, agGridRequest.endRow)
    return {funds, lastRow}
}

function applySort (funds, sortModel) {
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

function applyFilter (funds, filterModel) {
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
