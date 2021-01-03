import * as trade from './trade'
import * as properties from '../util/properties'
import moment from 'moment-business-days'
import { PredictResponse } from '../simulate/simulate'
import { Balance } from '../account/CharlesStanleyDirectAccount'
import { Buy, Sell } from './Action'

describe('trade', () => {
  describe('decideActions', () => {
    describe('with existing holdings', () => {
      const fundHoldBusinessDays = properties.get('trade.fund.hold.business.days')
      const today = moment().utc().startOf('day')
      const thresholdDate = today.businessSubtract(fundHoldBusinessDays)
      const balance = {
        cash: 0,
        holdings: [
          { ISIN: 'GB00B99C0657', Sedol: 'B99C065', Quantity: 100 },
          { ISIN: 'GB0006061963', Sedol: '0606196', Quantity: 50 }
        ]
      }
      const transactions = [
        {
          date: thresholdDate, // on or earlier than threshold
          description: '1322 LEGG MASO Del 3.72 S Date 01/01/15',
          stockDescription: 'LEGG MASON INV FDS IF JAPAN EQUITY HEDGED X AC',
          sedol: 'B99C065',
          contractReference: 'X88413',
          price: 3.78499,
          debit: 5004.68,
          credit: NaN,
          settlementDate: today,
          cash: 0
        },
        {
          date: thresholdDate.businessAdd(1), // later than threshold
          description: '356 BG AMC\'B\'ACC NAV Del 11.96 S Date 03/01/15',
          stockDescription: 'BAILLIE GIFFORD AMERICAN B NAV ACC',
          sedol: '0606196',
          contractReference: 'E59205',
          price: 11.95999,
          debit: 4170.84,
          credit: NaN,
          settlementDate: today,
          cash: 96.33
        }
      ]
      test('empty prediction should sell existing holdings before threshold', () => {
        const prediction: PredictResponse = {
          date: undefined,
          funds: []
        }
        const actions = trade.decideActions(prediction, balance, transactions)
        expect(actions).toIncludeSameMembers([
          new Sell('GB00B99C0657', 'B99C065', 100)
        ])
      })
      test('non-empty prediction should sell existing holdings before threshold', () => {
        const prediction: PredictResponse = {
          date: undefined,
          funds: [
            { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' }
          ]
        }
        const actions = trade.decideActions(prediction, balance, transactions)
        expect(actions).toIncludeSameMembers([
          new Sell('GB00B99C0657', 'B99C065', 100)
        ])
      })
      test('same predictions should result in no-op', () => {
        const prediction: PredictResponse = {
          date: undefined,
          funds: [
            { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' },
            { isin: 'GB0006061963', sedol: '0606196', name: 'Baillie Gifford American Fund B Accumulation' }
          ]
        }
        const actions = trade.decideActions(prediction, balance, [])
        expect(actions).toBeArray().toBeEmpty()
      })
    })

    describe('no existing holdings', () => {
      test('empty prediction should result in no-op', () => {
        const balance: Balance = { cash: 100, holdings: [], portfolio: undefined, totalValue: undefined }
        const prediction: PredictResponse = {
          date: undefined,
          funds: []
        }
        const actions = trade.decideActions(prediction, balance, [])
        expect(actions).toBeArray().toBeEmpty()
      })

      test('non-positive cash should result in no-op', () => {
        const zeroBalance: Balance = { cash: 0, holdings: [], portfolio: undefined, totalValue: undefined }
        const negativeBalance: Balance = { cash: -5, holdings: [], portfolio: undefined, totalValue: undefined }
        const prediction: PredictResponse = {
          date: undefined,
          funds: [
            { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' },
            { isin: 'GB0006061963', sedol: '0606196', name: 'Baillie Gifford American Fund B Accumulation' }
          ]
        }
        expect(trade.decideActions(prediction, zeroBalance, [])).toBeArray().toBeEmpty()
        expect(trade.decideActions(prediction, negativeBalance, [])).toBeArray().toBeEmpty()
      })
      test('non-empty prediction should buy holdings', () => {
        const balance: Balance = { cash: 100, holdings: [], portfolio: undefined, totalValue: undefined }
        const prediction: PredictResponse = {
          date: undefined,
          funds: [
            { isin: 'GB00B99C0657', sedol: 'B99C065', name: 'Legg Mason IF Japan Equity Fund Class X Accumulation (Hedged)' },
            { isin: 'GB0006061963', sedol: '0606196', name: 'Baillie Gifford American Fund B Accumulation' }
          ]
        }
        const actions = trade.decideActions(prediction, balance, [])
        expect(actions).toIncludeSameMembers([
          new Buy('GB00B99C0657', 'B99C065', 50),
          new Buy('GB0006061963', '0606196', 50)
        ])
      })
    })
  })
})
