import FundCalculator from './FundCalculator'
import Fund from './Fund'

import * as _ from 'lodash'

import * as StreamTest from 'streamtest'

describe('FundCalculator', function () {
  let fundCalculator: any, fund: any
  const returns = {
    '1M': 0.02
  }
  const historicPrices = [
    new Fund.HistoricPrice(new Date(2017, 3, 10), 486.0),
    new Fund.HistoricPrice(new Date(2017, 3, 11), 486.0),
    new Fund.HistoricPrice(new Date(2017, 3, 12), 482.0),
    new Fund.HistoricPrice(new Date(2017, 3, 13), 479.0),
    new Fund.HistoricPrice(new Date(2017, 3, 18), 475.0),
    new Fund.HistoricPrice(new Date(2017, 3, 19), 467.0),
    new Fund.HistoricPrice(new Date(2017, 3, 20), 468.0),
    new Fund.HistoricPrice(new Date(2017, 3, 21), 472.0),
    new Fund.HistoricPrice(new Date(2017, 3, 24), 469.0)
  ]
  const indicators = {
    stability: -3
  }

  beforeEach(function () {
    fundCalculator = new FundCalculator()
    fund = Fund.builder('GB00000ISIN0')
      .historicPrices(historicPrices)
      .returns(returns)
      .build()
  })

  test('evaluate should evaluate fund', async () => {
    const newReturns = _.assign(returns, {
      '2W': 0.01,
      '1W': 0.005
    })
    const fundWithNewReturns = Fund.builder('GB00000ISIN0')
      .historicPrices(historicPrices)
      .returns(newReturns)
      .build()
    const fundWithIndicators = Fund.builder('GB00000ISIN0')
      .historicPrices(historicPrices)
      .returns(newReturns)
      .indicators(indicators)
      .build()
    const fundResult = Fund.builder('GB00000ISIN0')
      .historicPrices(historicPrices)
      .returns(newReturns)
      .indicators(indicators)
      .build()

    jest.spyOn(fundCalculator, 'enrichReturns')
      .mockImplementation(async (f: any) => fundWithNewReturns)

    jest.spyOn(fundCalculator, 'calcIndicators')
      .mockImplementation(async (f: any) => {
        expect(f).toEqual(fundWithNewReturns)
        return fundWithIndicators
      })

    const actual = await fundCalculator.evaluate(fund)
    expect(actual).toEqual(fundResult)
  })

  test('stream should return a Transform stream that evaluates fund', (done: any) => {
    const newReturns = _.assign(returns, {
      '2W': 0.01,
      '1W': 0.005
    })
    const expected = Fund.builder('GB00000ISIN0')
      .historicPrices(historicPrices)
      .returns(newReturns)
      .build()

    const version = 'v2'

    jest.spyOn(fundCalculator, 'evaluate')
      .mockImplementation(async (f: any) => {
        expect(f).toEqual(fund)
        return expected
      })

    const fundStream = StreamTest[version].fromObjects([fund])
    fundStream
      .pipe(fundCalculator.stream())
      .pipe(StreamTest[version].toObjects((err: any, funds: any) => {
        expect(funds).toEqual([expected])
        done(err)
      }))
  })
})
