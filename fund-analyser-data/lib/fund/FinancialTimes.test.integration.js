const FinancialTimes = require('./FinancialTimes.js')
const Fund = require('./Fund.js')

const TIMEOUT = 7200000 // 2 hours

const chai = require('chai')
const chaiThings = require('chai-things')
chai.should()
chai.use(chaiThings)
const expect = chai.expect

describe('FinancialTimes', function () {
    this.timeout(TIMEOUT)
    let financialTimes
    beforeEach(function () {
        financialTimes = new FinancialTimes()
    })

    it('getFundsFromIsins should be able to return large collection of funds from Financial Times', function (done) {
        const isins = Array(4000).fill('GB00B80QG615')
        financialTimes.getFundsFromIsins(isins, (err, funds) => {
            expect(funds).to.be.an('array')
            funds.should.all.be.an.instanceOf(Fund)
            done(err)
        })
    })
})
