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
    return {
        city: body.city,
        region: body.regionName,
        country: body.country
    }
};
