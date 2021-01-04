import * as stockUtils from './stockUtils'
import Stock from '../stock/Stock'

describe('stockUtils', () => {
  describe('calcReturns', () => {
    const historicPrices = [
      new Stock.HistoricPrice(new Date(2017, 3, 10), 486.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 11), 486.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 12), 482.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 13), 479.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 18), 475.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 19), 467.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 20), 468.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 21), 472.0, 100000.0),
      new Stock.HistoricPrice(new Date(2017, 3, 24), 469.0, 100000.0)
    ]
    test('should calculate correct returns', () => {
      const returns = stockUtils.calcReturns(historicPrices)
      expect(returns).toHaveProperty('5Y', null)
      expect(returns).toHaveProperty('3Y', null)
      expect(returns).toHaveProperty('1Y', null)
      expect(returns).toHaveProperty('6M', null)
      expect(returns).toHaveProperty('3M', null)
      expect(returns).toHaveProperty('1M', null)
      expect(returns).toHaveProperty('2W', (469 - 486) / 486)
      expect(returns).toHaveProperty('1W', (469 - 475) / 475)
      expect(returns).toHaveProperty('3D', (469 - 472) / 472)
      expect(returns).toHaveProperty('1D', (469 - 472) / 472)
    })
  })
})
