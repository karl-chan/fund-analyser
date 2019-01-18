const Http = require('../util/http')

const cheerio = require('cheerio')
const moment = require('moment')

const http = new Http()

class NYTimes {
    async getExchangeTickers () {
        const { body } = await http.asyncGet('https://markets.on.nyTimes.com/research/markets/holidays/holidays.asp?display=market')
        const $ = cheerio.load(body)
        const tickers = $('#exchangeList > option').map((i, option) => $(option).attr('value')).get()
        return tickers
    }

    async getHolidaysForExchange (exchangeTicker) {
        const { body } = await http.asyncGet(`https://markets.on.nyTimes.com/research/markets/holidays/holidays.asp?display=market&exchange=${exchangeTicker}`)
        const $ = cheerio.load(body)
        const holidays = $('#holidayTable tr td:nth-child(1)').map((i, td) => moment($(td).text(), 'MM/DD/YYYY').toDate()).get()
        return holidays
    }
}

module.exports = NYTimes
