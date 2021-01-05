import * as cheerio from 'cheerio'
import Http from '../util/http'
import * as streamWrapper from '../util/streamWrapper'
import { SymbolProvider } from './StockFactory'

const http = new Http()

export default class WikipediaStocks implements SymbolProvider {
    sp500CompaniesUrl: any;
    constructor () {
      this.sp500CompaniesUrl = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    }

    async getSymbols () {
      const { body } = await http.asyncGet(this.sp500CompaniesUrl)
      const $ = cheerio.load(body)
      const symbols = $('#constituents > tbody td:nth-child(1)').map((i: any, td: any) => $(td).text().trim()).get()
      return symbols
    }

    /**
     * Analogous stream methods below
     */
    streamSymbols () {
      return streamWrapper.asTransformAsync(this.getSymbols)
    }
}
