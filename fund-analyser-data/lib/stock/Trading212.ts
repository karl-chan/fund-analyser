import cheerio from 'cheerio'
import Http from '../util/http'
import * as streamWrapper from '../util/streamWrapper'
import { SymbolProvider } from './StockFactory'

const http = new Http()

export default class Trading212 implements SymbolProvider {
  async getSymbols () {
    const url = 'https://www.trading212.com/en/Trade-Equities?tab=isa'
    const { body } = await http.asyncGet(url)
    const $ = cheerio.load(body)
    const symbols = $('#all-equities > div[id^="equity-row-"]')
      .filter((i, div) => $(div).find('> div[data-label="Market name"]').text().trim() === 'NASDAQ')
      .map((i, div) => $(div).find('> div[data-label="Instrument"]').text().trim())
      .get()
    return symbols
  }

  streamSymbols () {
    return streamWrapper.asReadableAsync(() => this.getSymbols())
  }
}
