import { Promise } from 'bluebird'
import * as _ from 'lodash'
import CharlesStanleyDirectAccount, { Balance } from '../account/CharlesStanleyDirectAccount'
import * as simulate from '../simulate/simulate'
import { SimulateParam } from '../simulate/simulate'
import * as math from '../util/math'
import { Action, Buy, Sell } from './Action'
import { AssetAllocation, Holding } from './AssetAllocation'

/**
 * Trades according to predictions today given by simulateParam.
 * @param {*} simulateParam the simulate param
 * @param {*} {csdAccount}
 * @returns {Array<string>} List of order references for each executed order
 */
export default async function trade (simulateParam: SimulateParam, { csdAccount }: {csdAccount: CharlesStanleyDirectAccount}) {
  const balance = await csdAccount.getBalance()
  const prediction = await simulate.predict(simulateParam)

  // Assume each prediction has equal weighting
  const targetAllocation = new AssetAllocation(
    prediction.funds.map(f => {
      const weight = 1.0 / prediction.funds.length
      return new Holding(f.isin, f.sedol, weight)
    })
  )
  const actions = rebalance(balance, targetAllocation)
  const orderReferences = await execute(actions, { csdAccount })
  return orderReferences
}

/**
 * Returns list of actions to rebalance from the given CSD balance to the target allocation.
 * @param {Balance} balance
 * @param {AssetAllocation} targetAllocation
 * @returns {Action[]}
 */
export function rebalance (balance: Balance, targetAllocation: AssetAllocation): Action[] {
  const { cash, holdings, totalValue } = balance

  const isinToExistingHolding = _.keyBy(holdings, h => h.ISIN)
  const isinToTargetHolding = _.keyBy(targetAllocation.holdings, h => h.isin)

  const actions = []
  if (holdings.length > 0) {
    // Existing holdings
    const sellActions = holdings.flatMap(h => {
      const targetWeight = isinToTargetHolding[h.ISIN]?.weight ?? 0
      const targetValue = targetWeight * totalValue
      const existingValue = h.MktValue
      if (math.roughEquals(existingValue, targetValue)) {
        // noop
        return []
      } else if (existingValue > targetValue) {
        // sell excess
        const excessValue = existingValue - targetValue
        const excessQuantity = excessValue / h.MktPrice
        return [new Sell(h.ISIN, h.Sedol, excessQuantity)]
      } else {
        // buy more, but will be handled later
        return []
      }
    })
    actions.push(...sellActions)
  }

  // Buy new holdings
  if (cash > 0) {
    let remainingCash = cash
    const buyActions: Buy[] = []

    for (const [isin, targetHolding] of Object.entries(isinToTargetHolding)) {
      if (remainingCash <= 0) {
        // If there's insufficient cash, skip and try again the next day
        break
      }
      const targetWeight = targetHolding.weight
      const targetValue = totalValue * targetWeight
      const existingValue = isinToExistingHolding[isin]?.MktValue ?? 0

      if (targetValue > existingValue) {
        const buyValue = Math.min(targetValue - existingValue, cash) // subject to available cash
        buyActions.push(new Buy(isin, targetHolding.sedol, buyValue))
        remainingCash -= buyValue
      }
    }
    actions.push(...buyActions)
  }
  return actions
}

/**
 * Executes the list of actions on Charles Stanley.
 * @param {List<Action>} actions
 * @param {*} {csdAccount}
 * @returns {List<string>} list of order reference for each executed action.
 */
async function execute (actions: Action[], { csdAccount }: {csdAccount: CharlesStanleyDirectAccount}) {
  const orderReferences = await Promise.mapSeries(actions, async action => {
    return csdAccount.tradeFund(action)
  })
  return orderReferences
}
