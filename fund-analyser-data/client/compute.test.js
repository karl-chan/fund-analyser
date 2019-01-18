const compute = require('./compute')

describe('compute', () => {
    test('admin/healthcheck', async () => {
        const res = await compute.exec('admin/healthcheck')
        expect(res).toBe('OK')
    })
})
