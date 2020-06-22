module.exports = {
    trade,
    decideActions
}

const { Buy, Sell } = require('./Action')
const simulate = require('../simulate/simulate')
const properties = require('../util/properties')

const Promise = require('bluebird')
const _ = require('lodash')
const moment = require('moment-business-days')

const fundHoldBusinessDays = properties.get('trade.fund.hold.business.days')

/**
 * Trades according to predictions today given by simulateParam.
 * @param {*} simulateParam the simulate param
 * @param {*} {csdAccount}
 * @returns {Array<string>} List of order references for each executed order
 */
async function trade (simulateParam, { csdAccount }) {
    const [balance, transactions] = await Promise.all([csdAccount.getBalance(), csdAccount.getTransactions()])
    const prediction = await simulate.predict(simulateParam)
    const actions = decideActions(prediction, balance, transactions)
    const orderReferences = await execute(actions, { csdAccount })
    return orderReferences
}

/**
 * Returns list of actions based on current prediction and CSD balance.
 * @param {*} prediction
 * @param {*} balance
 * @param {*} transactions
 * @returns {List<Action>}
 */
function decideActions (prediction, balance, transactions) {
    const { cash, holdings } = balance
    const { funds } = prediction
    if (holdings.length > 0) {
        // Existing holdings
        const existingIsins = holdings.map(holding => holding.ISIN)
        const predictIsins = funds.map(fund => fund.isin)
        if (_.isEqual(new Set(existingIsins), new Set(predictIsins))) {
            // noop
            return []
        } else {
            // sell existing holdings (if held at least for threshold period)
            const today = moment().utc().startOf('day')
            const thresholdDate = today.businessSubtract(fundHoldBusinessDays)
            const latestTransactions = [...transactions].reverse()
            return holdings
                .filter(
                    holding => {
                        const boughtDate = latestTransactions
                            .find(transaction => transaction.sedol === holding.Sedol && transaction.debit > 0)
                            .date
                        return thresholdDate.isSameOrAfter(boughtDate)
                    }
                )
                .map(holding => new Sell(holding.ISIN, holding.Sedol, holding.Quantity))
        }
    } else {
        // No existing holdings
        if (!funds.length || cash <= 0) {
            // noop
            return []
        } else {
            // buy predictions
            const value = cash / funds.length
            return funds.map(fund => new Buy(fund.isin, fund.sedol, value))
        }
    }
}

/**
 * Executes the list of actions on Charles Stanley.
 * @param {List<Action>} actions
 * @param {*} {csdAccount}
 * @returns {List<string>} list of order reference for each executed action.
 */
async function execute (actions, { csdAccount }) {
    const orderReferences = await Promise.mapSeries(actions, async action => {
        return csdAccount.tradeFund(action)
    })
    return orderReferences
}
