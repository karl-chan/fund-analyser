import Http from '../util/http'
import * as streamWrapper from '../util/streamWrapper'
import { SymbolProvider } from './StockFactory'

const http = new Http({
  headers: {
    Accept: '*/*',
    Connection: 'keep-alive'
  }
})

export default class Trading212 implements SymbolProvider {
  async getSymbols () {
    const token = await this.getToken()
    return this.getSymbolsWithToken(token)
  }

  private async getToken (): Promise<String> {
    const url = 'https://www.trading212.com/trading-instruments/isa'
    const { data } = await http.asyncGet(url)
    const match = data.match(/_next\/static\/([^/]+)\/_buildManifest.js/)
    if (!match) {
      throw new Error('Failed to extract token from Trading212!')
    }
    const token = match[1]
    return token
  }

  private async getSymbolsWithToken (token: String): Promise<string[]> {
    const url = `https://www.trading212.com/_next/data/${token}/en/trading-instruments/isa.json`
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
