const streamWrapper = require('./streamWrapper.js')
const StreamTest = require('streamtest')

describe('streamWraper', () => {
    test('asFilter', (done) => {
        const version = 'v2'
        const inputStream = StreamTest[version].fromObjects([1, 2, 3, 4, 5, 6])

        const isEven = (x, callback) => callback(null, x % 2 === 0)
        const filterFn = streamWrapper.asFilter(isEven)

        inputStream
            .pipe(filterFn)
            .pipe(StreamTest[version].toObjects((err, output) => {
                expect(err).toBeNull()
                expect(output).toEqual([2, 4, 6])
                done()
            }))
    })
})
