const heroku = require('./heroku')
const moment = require('moment')
const streamWrapper = require('./streamWrapper')
const Promise = require('bluebird')

jest.setTimeout(30000) // 30 seconds

describe('heroku', () => {
    test('getLastActivity', async () => {
        const lastActivity = await heroku.getLastActivity()
        // last activity should not be older than 10 minutes (ideally)
        expect(moment().diff(lastActivity)).toBeLessThan(moment.duration(10, 'minutes').asMilliseconds())
    })

    test('streamLogs', async () => {
        const spy = jest.fn()
        const sink = streamWrapper.asWritableAsync(async x => spy(x))

        const duration = 5000 // 5 seconds

        const logStream = await heroku.streamLogs()
        logStream.pipe(sink)
        await Promise.delay(duration)
        logStream.unpipe(sink)

        expect(spy.mock.calls.length).toBeGreaterThan(0)
        expect(spy.mock.calls).toSatisfyAll(call => {
            return typeof call[0] === 'string' && call[0]
        })
    })
})
