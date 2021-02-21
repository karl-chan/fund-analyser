import Http from './http'
import log from './log'

const http = new Http({
  maxAttempts: 1
})

const UNDEFINED_LOCATION = {
  city: undefined as string,
  region: undefined as string,
  country: undefined as string
}

export async function getLocationByIp (ip: any) {
  if (!ip) {
    return UNDEFINED_LOCATION
  }
  const url = `http://ip-api.com/json/${ip}`
  try {
    const { data } = await http.asyncGet(url, { responseType: 'json' })
    return {
      city: data.city,
      region: data.regionName,
      country: data.country
    }
  } catch (err) {
    log.warn('Failed to geolocate ip address: %s. Cause: %s', ip, err.stack)
    return UNDEFINED_LOCATION
  }
};
