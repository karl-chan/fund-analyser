import Http from './http'

jest.setTimeout(30000) // 30 seconds

describe('Http', () => {
  let http: any
  beforeEach(() => {
    http = new Http()
  })
  test('asyncGet with url only', async () => {
    const res = await http.asyncGet('http://www.duckduckgo.com')
    expect(res).toHaveProperty('statusCode', 200)
    expect(res.body).toBeString().not.toBeEmpty()
  })
  test('asyncGet with options', async () => {
    const res = await http.asyncGet('http://www.duckduckgo.com', { qs: { q: 'hello' } })
    expect(res).toHaveProperty('statusCode', 200)
    expect(res.body).toBeString().toInclude('hello')
  })
  test('asyncGet with concurrency', async () => {
    const rs = await Promise.all(new Array(20).fill('http://www.duckduckgo.com')
      .map(url => http.asyncGet(url)))
    expect(rs).toBeArrayOfSize(20)
    expect(rs).toSatisfyAll((res: any) => {
      return res.statusCode === 200 &&
                    typeof res.body === 'string' && res.body
    })
  })
})
