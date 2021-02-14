import { Promise } from 'bluebird'
import * as _ from 'lodash'
import { Readable, Transform } from 'stream'
import Stock from '../stock/Stock'
import * as streamWrapper from '../util/streamWrapper'
import MarketWatch from './MarketWatch'
import NYSEStocks from './NYSEStocks'
import StockCalculator from './StockCalculator'
import Trading212 from './Trading212'

export interface StockProvider {
    getStocksFromSymbols(symbols: string[]): Promise<Stock[]>
    streamStocksFromSymbols(): Transform
}

export interface SymbolProvider {
  getSymbols(): Promise<string[]>
  streamSymbols(): Readable
}

class CompoundSymbolProvider implements SymbolProvider {
  private symbolProviders: SymbolProvider[]
  constructor (...symbolProviders: SymbolProvider[]) {
    this.symbolProviders = symbolProviders
  }

  async getSymbols () {
    const allSymbols = await Promise.map(this.symbolProviders, (provider) => provider.getSymbols())
    return _.uniq(_.flatten(allSymbols))
  }

  streamSymbols (): Readable {
    return streamWrapper.asReadableAsync(() => this.getSymbols())
  }
}

export default class StockFactory {
    stockCalculator: StockCalculator;
    stockProvider: StockProvider;
    symbolProvider: SymbolProvider;
    constructor () {
      this.symbolProvider = new CompoundSymbolProvider(new NYSEStocks(), new Trading212())
      this.stockProvider = new MarketWatch()
      this.stockCalculator = new StockCalculator()
    }

    async getStocks () {
      const symbols = await this.symbolProvider.getSymbols()
      const stocks = await this.stockProvider.getStocksFromSymbols(symbols)
      const enrichedStocks = await Promise.map(stocks, stock => this.stockCalculator.evaluate(stock))
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
