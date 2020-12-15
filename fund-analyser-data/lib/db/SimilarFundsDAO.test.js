const SimilarFundsDAO = require('./SimilarFundsDAO')

const db = require('../util/db')

jest.setTimeout(30000) // 30 seconds

describe('SimilarFundsDAO', () => {
    beforeAll(async () => {
        await db.init()
    })
    afterAll(async () => {
        await db.close()
    })
    test('getSimilarFunds', async () => {
        const similarFunds = await SimilarFundsDAO.getSimilarFunds(['GB0006061963'])
        expect(similarFunds).toBeArrayOfSize(1)
        expect(similarFunds[0].isin).toBe('GB0006061963')
        expect(similarFunds[0].similarIsins).toIncludeAllMembers(['GB00BYNK7G95', 'GB0006061963', 'GB00BD5Z1070', 'GB00BZ4CG750', 'GB0006059223'])
        expect(similarFunds[0].afterFeesReturn).toBeGreaterThan(0)
    })
})
