import { Balance } from '../account/CharlesStanleyDirectAccount'
import { Buy, Sell } from './Action'
import { AssetAllocation, Holding } from './AssetAllocation'
import * as trade from './trade'

describe('trade', () => {
  describe('rebalance', () => {
    describe('with existing holdings', () => {
      const balance = {
        cash: 0,
        holdings: [
          { ISIN: 'GB00B99C0657', Sedol: 'B99C065', Quantity: 100, MktPrice: 3.98, MktValue: 398 },
          { ISIN: 'GB0006061963', Sedol: '0606196', Quantity: 50, MktPrice: 14.41, MktValue: 720.5 }
        ],
        portfolio: 1118.5,
        totalValue: 1118.5
      }
      test('empty target allocation should sell all existing holdings', () => {
        const targetAllocation = new AssetAllocation([])
        const actions = trade.rebalance(balance, targetAllocation)
        expect(actions).toIncludeSameMembers([
          new Sell('GB00B99C0657', 'B99C065', 100),
          new Sell('GB0006061963', '0606196', 50)
        ])
      })
      test('non-empty target allocation should sell overlapping existing holdings', () => {
        const targetAllocation = new AssetAllocation([
          new Holding('GB00B99C0657', 'B99C065', 1)
        ])
        const actions = trade.rebalance(balance, targetAllocation)
        expect(actions).toIncludeSameMembers([
          new Sell('GB0006061963', '0606196', 50)
        ])
      })
      test('same target allocation should result in no-op', () => {
        const targetAllocation = new AssetAllocation([
          new Holding('GB00B99C0657', 'B99C065', 0.356),
          new Holding('GB0006061963', '0606196', 0.644)
        ])
        const actions = trade.rebalance(balance, targetAllocation)
        expect(actions).toBeArray().toBeEmpty()
      })
    })

    describe('no existing holdings', () => {
      test('empty target allocation should result in no-op', () => {
        const balance: Balance = { cash: 100, holdings: [], portfolio: 0, totalValue: 100 }
        const targetAllocation = new AssetAllocation([])
        const actions = trade.rebalance(balance, targetAllocation)
        expect(actions).toBeArray().toBeEmpty()
      })

      test('non-positive cash should result in no-op', () => {
        const zeroBalance: Balance = { cash: 0, holdings: [], portfolio: 0, totalValue: 0 }
        const negativeBalance: Balance = { cash: -5, holdings: [], portfolio: 0, totalValue: -5 }
        const targetAllocation = new AssetAllocation([
          new Holding('GB00B99C0657', 'B99C065', 0.5),
          new Holding('GB0006061963', '0606196', 0.5)
        ])
        expect(trade.rebalance(zeroBalance, targetAllocation)).toBeArray().toBeEmpty()
        expect(trade.rebalance(negativeBalance, targetAllocation)).toBeArray().toBeEmpty()
      })
      test('non-empty target allocation should buy holdings', () => {
        const balance: Balance = { cash: 100, holdings: [], portfolio: 0, totalValue: 100 }
        const targetAllocation = new AssetAllocation([
          new Holding('GB00B99C0657', 'B99C065', 0.5),
          new Holding('GB0006061963', '0606196', 0.5)
        ])
        const actions = trade.rebalance(balance, targetAllocation)
        expect(actions).toIncludeSameMembers([
          new Buy('GB00B99C0657', 'B99C065', 50),
          new Buy('GB0006061963', '0606196', 50)
        ])
      })
    })
  })
})
