import moment from 'moment'

import * as cheerio from 'cheerio'
import Http from '../util/http'

const http = new Http()

export default class NYTimes {
  async getExchangeTickers () {
    const { body } = await http.asyncGet('https://markets.on.nyTimes.com/research/markets/holidays/holidays.asp?display=market')
    const $ = cheerio.load(body)
    const tickers = $('#exchangeList > option').map((i: any, option: any) => $(option).attr('value')).get()
    return tickers
  }

  async getHolidaysForExchange (exchangeTicker: any) {
    const { body } = await http.asyncGet(`https://markets.on.nyTimes.com/research/markets/holidays/holidays.asp?display=market&exchange=${exchangeTicker}`)
    const $ = cheerio.load(body)
    const holidays = $('#holidayTable tr td:nth-child(1)').map((i: any, td: any) => moment($(td).text(), 'MM/DD/YYYY').toDate()).get()
    return holidays
  }
}
