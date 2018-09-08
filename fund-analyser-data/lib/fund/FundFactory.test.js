const FundFactory = require('./FundFactory')
const Fund = require('./Fund')
const stream = require('stream')

const StreamTest = require('streamtest')

describe('FundFactory', function () {
    let fundFactory

    beforeEach(function () {
        fundFactory = new FundFactory()
    })

    test('getFunds should return array of funds', function (done) {
        const expected = [
            Fund.Builder('GB00000ISIN0').build(),
            Fund.Builder('GB00000ISIN1').build()
        ]

        jest.spyOn(fundFactory.isinProvider, 'getFunds')
            .mockImplementation(callback => {
                callback(null, ['GB00000ISIN0', 'GB00000ISIN1'])
            })
        jest.spyOn(fundFactory.fundProvider, 'getFundsFromIsins')
            .mockImplementation((isins, callback) => {
                expect(isins).toEqual(['GB00000ISIN0', 'GB00000ISIN1'])
                callback(null, expected)
            })
        jest.spyOn(fundFactory.fundCalculator, 'evaluate')
            .mockImplementation((fund, callback) => {
                expect(fund).toEqual(expected)
                callback(null, expected)
            })

        fundFactory.getFunds((err, actual) => {
            expect(actual).toEqual(expected)
            done(err)
        })
    })

    test('streamFunds should return a Transform stream outputting array of funds', function (done) {
        const isin1 = 'GB00000ISIN0'
        const isin2 = 'GB00000ISIN1'
        const fund1 = Fund.Builder(isin1).build()
        const fund2 = Fund.Builder(isin2).build()

        const version = 'v2'
        const isinStream = StreamTest[version].fromObjects([isin1, isin2])
        const isinToFundStream = new stream.Transform({
            objectMode: true,
            transform (chunk, encoding, callback) {
                switch (chunk) {
                case isin1:
                    return callback(null, fund1)
                case isin2:
                    return callback(null, fund2)
                default:
                    return callback(new Error(`Unrecognised isin: ${chunk}`))
                }
            }
        })
        const fundCalculationStream = new stream.Transform({
            objectMode: true,
            transform (chunk, encoding, callback) {
                callback(null, chunk)
            }
        })

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
})
