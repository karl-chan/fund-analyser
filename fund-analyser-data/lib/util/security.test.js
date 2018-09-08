const security = require('./security')

describe('encrypt', () => {
    test('encryptString decryptString should be inverses', () => {
        const s = 'The quick brown fox jumped over the lazy dog'
        expect(security.encryptString(s)).not.toEqual(s)
        expect(security.decryptString(security.encryptString(s))).toEqual(s)
    })
})
