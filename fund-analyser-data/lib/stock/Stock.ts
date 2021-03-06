import { isEmpty } from 'lodash'

class Stock {
  static schema = {
    symbol: 'string',
    name: 'string',
    historicPrices: 'Array',
    returns: {
      '5Y': 'number',
      '3Y': 'number',
      '1Y': 'number',
      '6M': 'number',
      '3M': 'number',
      '1M': 'number',
      '2W': 'number',
      '1W': 'number',
      '3D': 'number',
      '1D': 'number',
      '+1D': 'number'
    },
    asof: 'Date',
    indicators: 'object',
    realTimeDetails: {
      estChange: 'number',
      estPrice: 'number',
      bidAskSpread: 'number',
      longestTimeGap: 'number',
      lastUpdated: 'Date'
    },
    marketCap: 'number',
    yld: 'number'
  }

  asof: Date
  historicPrices: Stock.HistoricPrice[]
  indicators: object
  name: string
  realTimeDetails: Stock.RealTimeDetails
  returns: Stock.Returns
  symbol: string
  marketCap: number
  yld: number

  constructor (symbol: string, name: string, historicPrices: Stock.HistoricPrice[], returns: Stock.Returns, asof: Date, indicators: object, realTimeDetails: Stock.RealTimeDetails, marketCap: number, yld: number) {
    this.symbol = symbol
    this.name = name
    this.historicPrices = historicPrices
    this.returns = returns
    this.asof = asof
    this.indicators = indicators
    this.realTimeDetails = realTimeDetails
    this.marketCap = marketCap
    this.yld = yld
  }

  static builder (symbol: string) {
    return new Stock.Builder(symbol)
  }

  isValid () {
    return !isEmpty(this.name) && !isEmpty(this.historicPrices)
  }
}

// eslint-disable-next-line no-redeclare
namespace Stock {
  export class HistoricPrice {
    date: Date
    price: number
    volume: number
    constructor (date: Date, price: number, volume: number) {
      this.date = date
      this.price = price
      this.volume = volume
    }
  }

  export type Returns = { [lookback: string]: number }

  export interface RealTimeDetails {
    estChange: number
    estPrice: number
    bidAskSpread: number
    longestTimeGap: number
    lastUpdated: Date
  }

  export class Builder {
    _asof: Date
    _historicPrices: HistoricPrice[]
    _indicators: object
    _name: string
    _realTimeDetails: RealTimeDetails
    _returns: Returns
    _symbol: string
    _marketCap: number
    _yld: number
    constructor (symbol: string) {
      this._symbol = symbol
    }

    symbol (symbol: string) {
      this._symbol = symbol
      return this
    }

    name (name: string) {
      this._name = name
      return this
    }

    historicPrices (historicPrices: HistoricPrice[]) {
      this._historicPrices = historicPrices
      return this
    }

    returns (returns: Returns) {
      this._returns = returns
      return this
    }

    asof (asof: Date) {
      this._asof = asof
      return this
    }

    indicators (indicators: object) {
      this._indicators = indicators
      return this
    }

    realTimeDetails (realTimeDetails: RealTimeDetails) {
      this._realTimeDetails = realTimeDetails
      return this
    }

    marketCap (marketCap: number) {
      this._marketCap = marketCap
      return this
    }

    yld (yld: number) {
      this._yld = yld
      return this
    }

    build () {
      return new Stock(this._symbol, this._name, this._historicPrices, this._returns, this._asof, this._indicators, this._realTimeDetails, this._marketCap, this._yld)
    }
  }

}

export default Stock
