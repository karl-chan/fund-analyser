import { Promise } from 'bluebird'
import WikipediaStocks from './WikipediaStocks'
import MarketWatch from './MarketWatch'
import StockCalculator from './StockCalculator'
import * as streamWrapper from '../util/streamWrapper'
export default class StockFactory {
    stockCalculator: any;
    stockProvider: any;
    symbolProvider: any;
    constructor () {
      this.symbolProvider = new WikipediaStocks()
      this.stockProvider = new MarketWatch()
      this.stockCalculator = new StockCalculator()
    }

    async getStocks () {
      const symbols = await this.symbolProvider.getSymbols()
      const stocks = await this.stockProvider.getStocksFromSymbols(symbols)
      const enrichedStocks = await (Promise as any).map(stocks, this.stockCalculator.evaluate.bind(this))
      return enrichedStocks
    }

    streamStocks () {
      const symbolStream = this.symbolProvider.streamSymbols()
      const symbolToStockStream = this.stockProvider.streamStocksFromSymbols()
      const stockCalculationStream = this.stockCalculator.stream()
      const stockStream = symbolStream
        .pipe(symbolToStockStream)
        .pipe(stockCalculationStream)
      return stockStream
    }

    streamStocksFromSymbols (symbols: any) {
      const symbolStream = streamWrapper.asReadableAsync(async () => symbols)
      const symbolToStockStream = this.stockProvider.streamStocksFromSymbols()
      const stockCalculationStream = this.stockCalculator.stream()
      const stockStream = symbolStream
        .pipe(symbolToStockStream)
        .pipe(stockCalculationStream)
      return stockStream
    }
}
