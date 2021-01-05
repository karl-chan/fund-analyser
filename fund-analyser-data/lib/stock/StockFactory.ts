import { Promise } from 'bluebird'
import { Transform } from 'stream'
import Stock from '../stock/Stock'
import * as streamWrapper from '../util/streamWrapper'
import MarketWatch from './MarketWatch'
import StockCalculator from './StockCalculator'
import WikipediaStocks from './WikipediaStocks'

export interface StockProvider {
    getStocksFromSymbols(symbols: string[]): Promise<Stock[]>
    streamStocksFromSymbols(): Transform
}

export interface SymbolProvider {
  getSymbols(): Promise<string[]>
  streamSymbols(): Transform
}

export default class StockFactory {
    stockCalculator: StockCalculator;
    stockProvider: StockProvider;
    symbolProvider: SymbolProvider;
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
