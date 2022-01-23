/* eslint-disable no-use-before-define */
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

  constructor (
    public readonly symbol: string,
    public readonly name: string,
    public readonly historicPrices: Stock.HistoricPrice[],
    public readonly returns: Stock.Returns,
    public readonly asof: Date,
    public readonly indicators: object,
    public readonly realTimeDetails: Stock.RealTimeDetails,
    public readonly marketCap: number,
    public readonly yld: number
  ) { }

  static builder (symbol: string) {
    return new Stock.Builder(symbol)
  }

  isValid () {
    return !isEmpty(this.name) && !isEmpty(this.historicPrices)
  }

  toBuilder () {
    return Stock.builder(this.symbol)
      .name(this.name)
      .historicPrices(this.historicPrices)
      .returns(this.returns)
      .asof(this.asof)
      .indicators(this.indicators)
      .realTimeDetails(this.realTimeDetails)
      .marketCap(this.marketCap)
      .yld(this.yld)
  }
}

// eslint-disable-next-line no-redeclare
namespace Stock {
  export class HistoricPrice {
    constructor (public readonly date: Date, public readonly price: number, public readonly volume: number) { }
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
