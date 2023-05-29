import * as StreamTest from 'streamtest'
import * as streamWrapper from '../util/streamWrapper'
import Fund from './Fund'
import FundFactory from './FundFactory'

describe('FundFactory', function () {
  let fundFactory: FundFactory

  beforeEach(function () {
    fundFactory = new FundFactory()
  })

  test('getFunds should return array of funds', async () => {
    const expected = [
      Fund.builder('GB00000ISIN0').build(),
      Fund.builder('GB00000ISIN1').build()
    ]

    jest.spyOn(fundFactory.investmentIdProvider, 'getFunds')
      .mockImplementation(async () => expected)
    jest.spyOn(fundFactory.fundProvider, 'getFundsFromIsins')
      .mockImplementation(async isins => {
        expect(isins).toEqual(expected)
        return expected
      })
    jest.spyOn(fundFactory.fundCalculator, 'evaluate')
      .mockImplementation(async fund => fund)

    const actual = await fundFactory.getFunds()
    expect(actual).toEqual(expected)
  })

  test('streamFunds should return a Transform stream outputting array of funds', done => {
    const isin1 = 'GB00000ISIN0'
    const isin2 = 'GB00000ISIN1'
    const fund1 = Fund.builder(isin1).build()
    const fund2 = Fund.builder(isin2).build()

    const version = 'v2'
    const isinStream = StreamTest[version].fromObjects([isin1, isin2])
    const isinToFundStream = streamWrapper.asTransformAsync(async (isin: string) => {
      switch (isin) {
        case isin1: return fund1
        case isin2: return fund2
        default: throw new Error(`Unrecognised isin: ${isin}`)
      }
    })
    const fundCalculationStream = streamWrapper.asTransformAsync(async (fund: Fund) => fund)

    jest.spyOn(fundFactory.investmentIdProvider, 'streamFunds')
      .mockReturnValue(isinStream)
    jest.spyOn(fundFactory.fundProvider, 'streamFundsFromIsins')
      .mockReturnValue(isinToFundStream)
    jest.spyOn(fundFactory.fundCalculator, 'stream')
      .mockReturnValue(fundCalculationStream)

    fundFactory.streamFunds()
      .pipe(StreamTest[version].toObjects((err, funds) => {
        expect(funds).toEqual([fund1, fund2])
        done(err)
      }))
  })

  test('streamFundsFromInvestmentIds should return a Transform stream outputting array of funds', done => {
    const investmentId1 = 'investmentId01%3D'
    const investmentId2 = 'investmentId02%3D'
    const isin1 = 'GB00000ISIN0'
    const isin2 = 'GB00000ISIN1'
    const fund1 = Fund.builder(isin1).build()
    const fund2 = Fund.builder(isin2).build()

    const version = 'v2'
    const investmentIdToIsinStream = streamWrapper.asTransformAsync(async (investmentId: string) => {
      switch (investmentId) {
        case investmentId1: return isin1
        case investmentId2: return isin2
        default: throw new Error(`Unrecognised investment id: ${investmentId}`)
      }
    })
    const isinToFundStream = streamWrapper.asTransformAsync(async (isin: string) => {
      switch (isin) {
        case isin1: return fund1
        case isin2: return fund2
        default: throw new Error(`Unrecognised isin: ${isin}`)
      }
    })
    const fundCalculationStream = streamWrapper.asTransformAsync(async (fund: Fund) => fund)

    jest.spyOn(fundFactory.investmentIdProvider, 'streamFundsFromInvestmentIds')
      .mockReturnValue(investmentIdToIsinStream)
    jest.spyOn(fundFactory.fundProvider, 'streamFundsFromIsins')
      .mockReturnValue(isinToFundStream)
    jest.spyOn(fundFactory.fundCalculator, 'stream')
      .mockReturnValue(fundCalculationStream)

    fundFactory.streamFundsFromInvestmentIds([investmentId1, investmentId2])
      .pipe(StreamTest[version].toObjects((err, funds) => {
        expect(funds).toEqual([fund1, fund2])
        done(err)
      }))
  })
})
