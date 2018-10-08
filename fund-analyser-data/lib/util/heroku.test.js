const heroku = require('./heroku')
const moment = require('moment')

jest.setTimeout(30000) // 30 seconds

describe('heroku', () => {
    test('getLastActivity', async () => {
        const lastActivity = await heroku.getLastActivity()
        // last activity should not be older than 10 minutes (ideally)
        expect(moment().diff(lastActivity)).toBeLessThan(moment.duration(10, 'minutes').asMilliseconds())
    })
})
