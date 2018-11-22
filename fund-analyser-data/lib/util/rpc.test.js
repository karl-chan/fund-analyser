const rpc = require('./rpc')

describe('rpc', () => {
    describe('test connection', async () => {
        test('dev healthcheck', async () => {
            const response = await rpc.exec('healthcheck', undefined, 'dev')
            expect(response).toBe('OK')
        })
        test('prod healthcheck', async () => {
            const response = await rpc.exec('healthcheck', undefined, 'prod')
            expect(response).toBe('OK')
        })
    })
})
