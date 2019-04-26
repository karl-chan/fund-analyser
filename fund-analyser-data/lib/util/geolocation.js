module.exports = {
    getLocationByIp
}

const Http = require('./http')
const log = require('./log')

const http = new Http({
    maxAttempts: 1
})

async function getLocationByIp (ip) {
    if (!ip) {
        return {}
    }
    const url = `http://ip-api.com/json/${ip}`
    try {
        const { body } = await http.asyncGet(url)
        const data = JSON.parse(body)
        return {
            city: data.city,
            region: data.regionName,
            country: data.country
        }
    } catch (err) {
        log.warn('Failed to geolocate ip address: %s. Cause: %s', ip, err.stack)
        return {
            city: undefined,
            region: undefined,
            country: undefined
        }
    }
};
