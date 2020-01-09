const heroku = require('./heroku')
const moment = require('moment')
const streamWrapper = require('./streamWrapper')
const Promise = require('bluebird')

jest.setTimeout(30000) // 30 seconds

describe('heroku', () => {
    test('getLastActivity', async () => {
        const lastActivity = await heroku.getLastActivity(heroku.WEB_CATEGORY)
        // last activity should not be older than 10 minutes (ideally)
        expect(moment().diff(lastActivity)).toBeLessThan(moment.duration(10, 'minutes').asMilliseconds())
    })

    test('streamLogs', async () => {
        const spy = jest.fn()
        const sink = streamWrapper.asWritableAsync(async x => spy(x))

        const duration = 5000 // 5 seconds

        const logStream = await heroku.streamLogs(heroku.WORKER_CATEGORY)
        logStream.pipe(sink)
        await Promise.delay(duration)
        logStream.unpipe(sink)

        const timestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        expect(spy.mock.calls.length).toBeGreaterThan(0)
        expect(spy.mock.calls[0][0]).toMatch(timestampRegex)
    })
})
