const FinancialTimes = require('./FinancialTimes.js')
const Fund = require('./Fund.js')

const TIMEOUT = 7200000 // 2 hours

describe('FinancialTimes', function () {
    jest.setTimeout(TIMEOUT)
    let financialTimes
    beforeEach(function () {
        financialTimes = new FinancialTimes()
    })

    it('getFundsFromIsins should be able to return funds from Financial Times', function (done) {
        const isins = Array(10).fill('GB00B80QG615')
        financialTimes.getFundsFromIsins(isins, (err, funds) => {
            expect(funds).toBeArray()
            for (let fund of funds) {
                expect(fund).toBeInstanceOf(Fund)
            }
            done(err)
        })
    })
})
