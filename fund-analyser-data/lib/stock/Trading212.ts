import Http from '../util/http'
import * as streamWrapper from '../util/streamWrapper'
import { SymbolProvider } from './StockFactory'

const http = new Http()

export default class Trading212 implements SymbolProvider {
  async getSymbols () {
    const url = 'https://www.trading212.com/_next/data/GCDBRUACXTuoU2BcbGIr6/en/trading-instruments/isa.json'
    const { data } = await http.asyncGet(url, { responseType: 'json' })
    const symbols =
      data.pageProps.instruments.items
        .filter((item: any) => item.type === 'STOCK')
        .map((item: any) => item.shortName)
    return symbols
  }

  streamSymbols () {
    return streamWrapper.asReadableAsync(() => this.getSymbols())
  }
}
