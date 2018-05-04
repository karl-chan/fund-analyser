const geolocation = require('./geolocation.js')

const _ = require('lodash')
const chai = require('chai')
const assert = chai.assert

describe('geolocation', function () {
    describe('getLocationByIp', function () {
        it('should return geolocation for valid ip', async function () {
            const expected = {
                city: 'Newcastle upon Tyne',
                region: 'England',
                country: 'United Kingdom'
            }
            const actual = await geolocation.getLocationByIp('82.0.0.0')
            assert.deepEqual(actual, expected)
        })
        it('should return undefined fields for invalid ip', async function () {
            const expected = {
                city: undefined,
                region: undefined,
                country: undefined
            }
            const actual = await geolocation.getLocationByIp('127.0.0.1')
            assert.deepEqual(actual, expected)
        })
    })
})
