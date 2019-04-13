const compute = require('./compute')

describe('compute', () => {
    test('get', async () => {
        const res = await compute.get('admin/healthcheck')
        expect(res).toBe('OK')
    })
    test('post', async () => {
        const res = await compute.post('admin/healthcheck')
        expect(res).toBe('OK')
    })
})
