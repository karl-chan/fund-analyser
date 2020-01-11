module.exports = {
    trade,
    decideActions
}

const { Buy, Sell } = require('./Action')
const simulate = require('../simulate/simulate')

const Promise = require('bluebird')
const _ = require('lodash')

/**
 * Trades according to predictions today given by simulateParam.
 * @param {*} simulateParam the simulate param
 * @param {*} {csdAccount}
 * @returns {Array<string>} List of order references for each executed order
 */
async function trade (simulateParam, { csdAccount }) {
    const balance = await csdAccount.getBalance()
    const prediction = await simulate.predict(simulateParam)
    const actions = decideActions(prediction, balance)
    const orderReferences = await execute(actions, { csdAccount })
    return orderReferences
}

/**
 * Returns list of actions based on current prediction and CSD balance.
 * @param {*} prediction
 * @param {*} balance
 * @returns {List<Action>}
 */
function decideActions (prediction, balance) {
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
            // sell existing holdings
            return holdings.map(holding => new Sell(holding.ISIN, holding.Sedol, holding.Quantity))
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
