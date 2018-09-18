const Http = require('./http')

jest.setTimeout(10000) // 10 seconds

describe('Http', () => {
    let http
    beforeEach(() => {
        http = new Http()
    })
    test('asyncGet with url only', async () => {
        const res = await http.asyncGet('http://www.google.com')
        expect(res).toHaveProperty('statusCode', 200)
        expect(res.body).toBeString().not.toBeEmpty()
    })
    test('asyncGet with options', async () => {
        const res = await http.asyncGet('http://www.duckduckgo.com', {qs: {q: 'hello'}})
        expect(res).toHaveProperty('statusCode', 200)
        expect(res.body).toBeString().not.toBeEmpty()
    })
    test('asyncGet with concurrency', async () => {
        const rs = await Promise.all(new Array(20).fill('http://www.google.com')
            .map(url => http.asyncGet(url)))
        expect(rs).toBeArrayOfSize(20)
        for (let res of rs) {
            expect(res).toHaveProperty('statusCode', 200)
            expect(res.body).toBeString().not.toBeEmpty()
        }
    })
})
