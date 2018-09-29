const db = require('./db')
const Promise = require('bluebird')

describe('db', () => {
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    test('connectivity test', async () => {
        const {mainClient, fundClients} = db.get()

        let res = await mainClient.isConnected()
        expect(res).toBeTrue()

        res = await Promise.map(fundClients, client => client.isConnected())
        expect(res).toBeArray().not.toBeEmpty().toSatisfyAll(res => res === true)
    })
})
