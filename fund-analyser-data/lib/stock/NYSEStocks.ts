import Http from '../util/http'
import * as streamWrapper from '../util/streamWrapper'
import { SymbolProvider } from './StockFactory'

const http = new Http()

export default class NYSEStocks implements SymbolProvider {
  async getSymbols () {
    const url = 'https://www.nyse.com/api/quotes/filter'
    const data = await http.asyncPost(url, {
      json: true,
      body: {
        instrumentType: 'COMMON_STOCK',
        pageNumber: 1,
        sortColumn: 'NORMALIZED_TICKER',
        sortOrder: 'ASC',
        maxResultsPerPage: 100000,
        filterToken: ''
      }
    })
    return data.body.map((o: { symbolTicker: any }) => o.symbolTicker)
  }

  streamSymbols () {
    return streamWrapper.asReadableAsync(this.getSymbols)
  }
}
