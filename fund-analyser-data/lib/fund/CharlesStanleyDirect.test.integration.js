const CharlesStanleyDirect = require('./CharlesStanleyDirect.js')

const TIMEOUT = 7200000 // 2 hours

const chai = require('chai')
const chaiThings = require('chai-things')
chai.should()
chai.use(chaiThings)
const expect = chai.expect
const should = chai.should

describe('CharlesStanleyDirect', function () {
    this.timeout(TIMEOUT)
    let charlesStanleyDirect
    beforeEach(function () {
        charlesStanleyDirect = new CharlesStanleyDirect()
    })

    it('getIsins should be able to return large collection of isins in Charles Stanley', function (done) {
        charlesStanleyDirect.getIsins((err, isins) => {
            expect(isins).to.be.an('array')
            isins.should.all.have.lengthOf(7)
            done(err)
        })
    })
})
