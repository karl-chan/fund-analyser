const MarketsInsider = require('./MarketsInsider')
const StockCalculator = require('./StockCalculator')
const streamWrapper = require('../util/streamWrapper')

const Promise = require('bluebird')

class StockFactory {
    constructor () {
        this.symbolProvider = new MarketsInsider()
        this.stockProvider = new MarketsInsider()
        this.stockCalculator = new StockCalculator()
    }

    async getStocks () {
        const symbols = await this.symbolProvider.getSymbols()
        const stocks = await this.stockProvider.getStocksFromSymbols(symbols)
        const enrichedStocks = await Promise.map(stocks, this.stockCalculator.evaluate.bind(this))
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

    streamStocksFromSymbols (symbols) {
        const symbolStream = streamWrapper.asReadableAsync(async () => symbols)
        const symbolToStockStream = this.stockProvider.streamStocksFromSymbols()
        const stockCalculationStream = this.stockCalculator.stream()

        const stockStream = symbolStream
            .pipe(symbolToStockStream)
            .pipe(stockCalculationStream)
        return stockStream
    }
}

module.exports = StockFactory
