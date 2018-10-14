module.exports = {
    getLocationByIp
}

const Http = require('./http')

const http = new Http()

async function getLocationByIp (ip) {
    if (!ip) {
        return {}
    }
    const url = `http://ip-api.com/json/${ip}`
    const { body } = await http.asyncGet(url)
    const data = JSON.parse(body)
    return {
        city: data.city,
        region: data.regionName,
        country: data.country
    }
};
