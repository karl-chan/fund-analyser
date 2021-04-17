import Http from '../util/http'
import * as streamWrapper from '../util/streamWrapper'
import { SymbolProvider } from './StockFactory'

const http = new Http()

export default class Trading212 implements SymbolProvider {
  async getSymbols () {
    const url = 'https://www.trading212.com/en/Trade-Equities?tab=isa'
    const { data } = await http.asyncGet(url)
    const symbols = Array.from(
      (data as string)
        .matchAll(/data-label="Instrument">([^<]+)<\/div>(?:.*\n){6}.*NASDAQ/g))
      .map(group => group[1])
    return symbols
  }

  streamSymbols () {
    return streamWrapper.asReadableAsync(() => this.getSymbols())
  }
}
