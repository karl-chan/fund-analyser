const CharlesStanleyDirect = require('./CharlesStanleyDirect.js')

const TIMEOUT = 600000 // 10 mins

describe('CharlesStanleyDirect', () => {
    jest.setTimeout(TIMEOUT)

    let charlesStanleyDirect
    beforeEach(() => {
        charlesStanleyDirect = new CharlesStanleyDirect()
    })

    it('getIsins should be able to return large collection of sedols in Charles Stanley', done => {
        charlesStanleyDirect.getSedols((err, sedols) => {
            expect(sedols).toBeArray()
            expect(sedols).toSatisfyAll(sedol => sedol.length === 7)
            done(err)
        })
    })
})
