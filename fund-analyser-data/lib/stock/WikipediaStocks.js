const cheerio = require('cheerio')
const Http = require('../util/http')
const streamWrapper = require('../util/streamWrapper')

const http = new Http()

class WikipediaStocks {
    constructor () {
        this.sp500CompaniesUrl = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    }

    async getSymbols () {
        const { body } = await http.asyncGet(this.sp500CompaniesUrl)
        const $ = cheerio.load(body)
        const symbols = $('#constituents > tbody td:nth-child(1)').map((i, td) => $(td).text().trim()).get()
        return symbols
    }

    /**
     * Analogous stream methods below
     */
    streamSymbols () {
        return streamWrapper.asTransformAsync(this.getSymbols)
    }
}

module.exports = WikipediaStocks
