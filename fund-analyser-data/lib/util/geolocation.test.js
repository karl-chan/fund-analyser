const geolocation = require('./geolocation')

jest.setTimeout(30000) // 30 seconds

describe('geolocation', () => {
    describe('getLocationByIp', () => {
        test('should return geolocation for valid ip', async () => {
            const expected = {
                region: 'England',
                country: 'United Kingdom'
            }
            const actual = await geolocation.getLocationByIp('82.0.0.0')
            expect(actual).toMatchObject(expected)
        })
        test('should return undefined fields for invalid ip', async () => {
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
