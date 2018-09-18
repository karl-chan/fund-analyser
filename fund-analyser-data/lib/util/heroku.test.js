const heroku = require('./heroku')
const moment = require('moment')

jest.setTimeout(30000) // 30 seconds

describe('heroku', () => {
    test('getLogs', async () => {
        const logs = await heroku.getLogs()
        expect(logs).toBeString()
        expect(logs).not.toBeEmpty()
        // log should start with timestamp
        expect(logs).toBe(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\d{2}/))
    })

    test('getLastActivity', async () => {
        const lastActivity = await heroku.getLastActivity()
        // last activity should not be older than 10 minutes (ideally)
        expect(moment().diff(lastActivity)).toBeLessThan(moment.duration(10, 'minutes').asMilliseconds())
    })
})
