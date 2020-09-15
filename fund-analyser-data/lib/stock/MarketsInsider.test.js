const MarketsInsider = require('./MarketsInsider')
const Stock = require('./Stock')

const _ = require('lodash')
const moment = require('moment')
const StreamTest = require('streamtest')

jest.setTimeout(30000) // 30 seconds

describe('MarketsInsider', () => {
    let marketsInsider
    beforeEach(() => {
        marketsInsider = new MarketsInsider()
    })
    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Core methods', () => {
        test('getSymbols should return array of symbols', async () => {
            const symbols = await marketsInsider.getSymbols()
            expect(symbols).toIncludeAllMembers(['AAPL', 'GOOG'])
            expect(symbols.length).toBeGreaterThan(400)
        })

        test('getNumPages should return positive integer', async () => {
            const numPages = await marketsInsider.getNumPages()
            expect(numPages).toBePositive()
        })

        test('getPageRange should return array of consecutive ints', async () => {
            const lastPage = 71
            const pageRange = await marketsInsider.getPageRange(lastPage)
            expect(pageRange).toEqual(_.range(1, lastPage + 1))
        })

        test('getSymbolsFromPage should return array of symbols', async () => {
            const samplePage = 1
            const symbols = await marketsInsider.getSymbolsFromPage(samplePage)
            expect(symbols).toBeArray()
            expect(symbols).toSatisfyAll(symbol => /^\w+$/.test(symbol))
        })

        test('getSymbolsFromPages should return array of symbols', async () => {
            const pages = [1, 2]

            jest.spyOn(marketsInsider, 'getSymbolsFromPage')
                .mockImplementation(async page => {
                    switch (page) {
                        case 1:
                            return ['AAPL', 'GOOG']
                        case 2:
                            return ['MSFT', 'TSLA']
                    }
                })
            const sedols = await marketsInsider.getSymbolsFromPages(pages)
            expect(sedols).toEqual(['AAPL', 'GOOG', 'MSFT', 'TSLA'])
        })

        test('getStockFromSymbol should return stock', async () => {
            const symbol = 'AAPL'
            const summary = {
                name: 'APPLE',
                realTimeDetails: {
                    estPrice: 351.7,
                    estChange: 0.0003,
                    lastUpdated: new Date(2017, 0, 1)
                }
            }
            const historicPrices = [
                new Stock.HistoricPrice(new Date(2017, 0, 1), 457.0, 458.0, 456.0, 457.0, 100000.0)
            ]

            jest.spyOn(marketsInsider, 'getSummary')
                .mockImplementation(async (symbol) => summary)
            jest.spyOn(marketsInsider, 'getHistoricPrices')
                .mockImplementation(async (symbol) => historicPrices)

            const expected = Stock.Builder(symbol)
                .name(summary.name)
                .historicPrices(historicPrices)
                .asof(new Date(2017, 0, 1))
                .realTimeDetails(summary.realTimeDetails)
                .build()

            const actual = await marketsInsider.getStockFromSymbol(symbol)
            expect(actual).toMatchObject(expected)
        })

        test('getStocksFromSymbols should return array of partial fund', async () => {
            const sedols = ['AAPL', 'GOOG']
            const stocks = [
                Stock.Builder('AAPL'),
                Stock.Builder('GOOG')
            ]

            jest.spyOn(marketsInsider, 'getStockFromSymbol')
                .mockImplementation(async sedol => {
                    switch (sedol) {
                        case 'AAPL':
                            return stocks[0]

                        case 'GOOG':
                            return stocks[1]
                    }
                })
            const actual = await marketsInsider.getStocksFromSymbols(sedols)
            expect(actual).toEqual(stocks)
        })

        test('getSummary should return summary object', async () => {
            const summary = await marketsInsider.getSummary('AAPL')
            expect(summary.name).toEqual('Apple Inc.')
            expect(summary.realTimeDetails).toMatchObject({
                estPrice: expect.toBeNumber(),
                estChange: expect.toBeNumber()
            })
        })

        test('getHistoricPrices should return historic prices object', async () => {
            const historicPrices = await marketsInsider.getHistoricPrices('AAPL')
            expect(historicPrices).toBeArray().not.toBeEmpty()
            expect(historicPrices).toSatisfyAll(hp => {
                return hp instanceof Stock.HistoricPrice &&
                        moment(hp.date).isValid() &&
                        typeof hp.open === 'number' && !isNaN(hp.open) &&
                        typeof hp.high === 'number' && !isNaN(hp.high) &&
                        typeof hp.low === 'number' && !isNaN(hp.low) &&
                        typeof hp.close === 'number' && !isNaN(hp.close) &&
                        typeof hp.volume === 'number' && !isNaN(hp.volume) &&
                        hp.close !== 0
            })
        })
    })

    describe('Stream methods', function () {
        const version = 'v2'
        test('streamStocksFromSymbols should return Transform stream outputting array of stocks', done => {
            const symbol1 = 'AAPL'
            const symbol2 = 'GOOG'
            const stock1 = Stock.Builder(symbol1).build()
            const stock2 = Stock.Builder(symbol2).build()

            jest.spyOn(marketsInsider, 'getStockFromSymbol')
                .mockImplementation(async symbol => {
                    switch (symbol) {
                        case symbol1:
                            return stock1
                        case symbol2:
                            return stock2
                    }
                })

            const symbolToFundStream = marketsInsider.streamStocksFromSymbols()
            StreamTest[version].fromObjects([symbol1, symbol2])
                .pipe(symbolToFundStream)
                .pipe(StreamTest[version].toObjects((err, funds) => {
                    expect(funds).toEqual([stock1, stock2])
                    done(err)
                }))
        })
    })
})
