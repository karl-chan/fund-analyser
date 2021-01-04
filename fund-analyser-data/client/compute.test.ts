import * as compute from './compute'

describe('compute', () => {
  test('get', async () => {
    const res = await compute.get('/')
    expect(res).toBe('OK')
  })
  test('post', async () => {
    const res = await compute.post('/')
    expect(res).toBe('OK')
  })
})
