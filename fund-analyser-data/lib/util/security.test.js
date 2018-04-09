const security = require('./security.js')

const chai = require('chai')
const assert = chai.assert

describe('encrypt', function () {
    it('encryptString decryptString should be inverses', function () {
        const s = 'The quick brown fox jumped over the lazy dog'
        assert.notEqual(s, security.encryptString(s))
        assert.equal(s, security.decryptString(security.encryptString(s)))
    })
})
