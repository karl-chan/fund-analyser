const properties = require('./properties')

describe('properties', () => {
    test('should return undefined for missing property', () => {
        expect(properties.get('missing.property')).toBeUndefined()
    })
    test('should return property from system environment', () => {
        expect(properties.get('NODE_ENV')).toBe('development')
    })
    test('should return property from config file', () => {
        expect(properties.get('log.level')).toBe('debug')
    })
    test('should return parsed json', () => {
        expect(properties.get('fund.lookbacks')).toEqual(['5Y', '3Y', '1Y', '6M', '3M', '1M', '2W', '1W', '3D', '1D'])
    })
})
