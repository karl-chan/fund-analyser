const geolocation = require('./geolocation.js')

describe('geolocation', () => {
    describe('getLocationByIp', () => {
        it('should return geolocation for valid ip', async () => {
            const expected = {
                city: 'Newcastle upon Tyne',
                region: 'England',
                country: 'United Kingdom'
            }
            const actual = await geolocation.getLocationByIp('82.0.0.0')
            expect(actual).toEqual(expected)
        })
        it('should return undefined fields for invalid ip', async () => {
            const expected = {
                city: undefined,
                region: undefined,
                country: undefined
            }
            const actual = await geolocation.getLocationByIp('127.0.0.1')
            expect(actual).toEqual(expected)
        })
    })
})
