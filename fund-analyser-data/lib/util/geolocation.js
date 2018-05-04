module.exports = {
    getLocationByIp
}

const http = require('./http')

async function getLocationByIp (ip) {
    if (!ip) {
        return {}
    }
    const url = `http://ip-api.com/json/${ip}`
    const {body} = await http.asyncGet(url)
    const data = JSON.parse(body)
    return {
        city: data.city,
        region: data.regionName,
        country: data.country
    }
};
