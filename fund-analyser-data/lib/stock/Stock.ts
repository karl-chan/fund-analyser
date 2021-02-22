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
      lastUpdated: 'Date'
    },
    bidAskSpread: 'number',
    longestTimeGap: 'number',
    marketCap: 'number'
  }

  asof: Date
  historicPrices: Stock.HistoricPrice[]
  indicators: object
  name: string
  realTimeDetails: Stock.RealTimeDetails
  returns: Stock.Returns
  symbol: string
  bidAskSpread: number
  longestTimeGap: number
  marketCap: number

  constructor (symbol: string, name: string, historicPrices: Stock.HistoricPrice[], returns: Stock.Returns, asof: Date, indicators: object, realTimeDetails: Stock.RealTimeDetails, bidAskSpread: number, longestTimeGap: number, marketCap: number) {
    this.symbol = symbol
    this.name = name
    this.historicPrices = historicPrices
    this.returns = returns
    this.asof = asof
    this.indicators = indicators
    this.realTimeDetails = realTimeDetails
    this.bidAskSpread = bidAskSpread
    this.longestTimeGap = longestTimeGap
    this.marketCap = marketCap
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
    estChange: number,
    estPrice: number,
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
    _bidAskSpread: number
    _longestTimeGap: number
    _marketCap: number
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

    bidAskSpread (bidAskSpread: number) {
      this._bidAskSpread = bidAskSpread
      return this
    }

    longestTimeGap (longestTimeGap: number) {
      this._longestTimeGap = longestTimeGap
      return this
    }

    marketCap (marketCap: number) {
      this._marketCap = marketCap
      return this
    }

    build () {
      return new Stock(this._symbol, this._name, this._historicPrices, this._returns, this._asof, this._indicators, this._realTimeDetails, this._bidAskSpread, this._longestTimeGap, this._marketCap)
    }
  }

}

export default Stock
