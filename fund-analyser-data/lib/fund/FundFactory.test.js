const FundFactory = require('./FundFactory')
const Fund = require('./Fund')
const streamWrapper = require('../util/streamWrapper')

const StreamTest = require('streamtest')

describe('FundFactory', function () {
    let fundFactory

    beforeEach(function () {
        fundFactory = new FundFactory()
    })

    test('getFunds should return array of funds', async () => {
        const expected = [
            Fund.Builder('GB00000ISIN0').build(),
            Fund.Builder('GB00000ISIN1').build()
        ]

        jest.spyOn(fundFactory.isinProvider, 'getFunds')
            .mockImplementation(async () => ['GB00000ISIN0', 'GB00000ISIN1'])
        jest.spyOn(fundFactory.fundProvider, 'getFundsFromIsins')
            .mockImplementation(async isins => {
                expect(isins).toEqual(['GB00000ISIN0', 'GB00000ISIN1'])
                return expected
            })
        jest.spyOn(fundFactory.fundCalculator, 'evaluate')
            .mockImplementation(async fund => fund)

        const actual = await fundFactory.getFunds()
        expect(actual).toEqual(expected)
    })

    test('streamFunds should return a Transform stream outputting array of funds', (done) => {
        const isin1 = 'GB00000ISIN0'
        const isin2 = 'GB00000ISIN1'
        const fund1 = Fund.Builder(isin1).build()
        const fund2 = Fund.Builder(isin2).build()

        const version = 'v2'
        const isinStream = StreamTest[version].fromObjects([isin1, isin2])
        const isinToFundStream = streamWrapper.asTransformAsync(async isin => {
            switch (isin) {
                case isin1: return fund1
                case isin2: return fund2
                default: throw new Error(`Unrecognised isin: ${isin}`)
            }
        })
        const fundCalculationStream = streamWrapper.asTransformAsync(async fund => fund)

        jest.spyOn(fundFactory.isinProvider, 'streamFunds')
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

    test('streamFundsFromSedols should return a Transform stream outputting array of funds', (done) => {
        const sedol1 = 'SEDOL1'
        const sedol2 = 'SEDOL2'
        const isin1 = 'GB00000ISIN0'
        const isin2 = 'GB00000ISIN1'
        const fund1 = Fund.Builder(isin1).build()
        const fund2 = Fund.Builder(isin2).build()

        const version = 'v2'
        const sedolToIsinStream = streamWrapper.asTransformAsync(async sedol => {
            switch (sedol) {
                case sedol1: return isin1
                case sedol2: return isin2
                default: throw new Error(`Unrecognised sedol: ${sedol}`)
            }
        })
        const isinToFundStream = streamWrapper.asTransformAsync(async isin => {
            switch (isin) {
                case isin1: return fund1
                case isin2: return fund2
                default: throw new Error(`Unrecognised isin: ${isin}`)
            }
        })
        const fundCalculationStream = streamWrapper.asTransformAsync(async fund => fund)

        jest.spyOn(fundFactory.isinProvider, 'streamFundsFromSedols')
            .mockReturnValue(sedolToIsinStream)
        jest.spyOn(fundFactory.fundProvider, 'streamFundsFromIsins')
            .mockReturnValue(isinToFundStream)
        jest.spyOn(fundFactory.fundCalculator, 'stream')
            .mockReturnValue(fundCalculationStream)

        fundFactory.streamFundsFromSedols([sedol1, sedol2])
            .pipe(StreamTest[version].toObjects((err, funds) => {
                expect(funds).toEqual([fund1, fund2])
                done(err)
            }))
    })
})
