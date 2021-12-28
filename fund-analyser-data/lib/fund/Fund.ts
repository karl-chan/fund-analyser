/* eslint-disable no-use-before-define */
import { isEmpty } from 'lodash'

class Fund {
  static types = Object.freeze({
    OEIC: 'OEIC',
    UNIT: 'UNIT'
  })

  static shareClasses = Object.freeze({
    INC: 'Inc',
    ACC: 'Acc'
  })

  static schema = {
    isin: 'string',
    sedol: 'string',
    name: 'string',
    type: 'string',
    shareClass: 'string',
    frequency: 'string',
    ocf: 'number',
    amc: 'number',
    entryCharge: 'number',
    exitCharge: 'number',
    bidAskSpread: 'number',
    holdings: 'Array',
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
      stdev: 'number',
      ci: 'Array',
      holdings: 'Array',
      lastUpdated: 'Date'
    }
  }

  amc: number
  asof: Date
  bidAskSpread: number
  entryCharge: number
  exitCharge: number
  frequency: string
  historicPrices: Fund.HistoricPrice[]
  holdings: Fund.Holding[]
  indicators: object
  isin: string
  name: string
  ocf: number
  realTimeDetails: Fund.RealTimeDetails
  returns: Fund.Returns
  sedol: string
  shareClass: any
  type: any

  constructor (isin: string, sedol: string, name: string, type: any, shareClass: any, frequency: string, ocf: number, amc: number, entryCharge: number, exitCharge: number, bidAskSpread: number, holdings: Fund.Holding[], historicPrices: Fund.HistoricPrice[], returns: Fund.Returns, asof: Date, indicators: object, realTimeDetails: Fund.RealTimeDetails) {
    this.isin = isin
    this.sedol = sedol
    this.name = name
    this.type = type
    this.shareClass = shareClass
    this.frequency = frequency
    this.ocf = ocf
    this.amc = amc
    this.entryCharge = entryCharge
    this.exitCharge = exitCharge
    this.bidAskSpread = bidAskSpread
    this.holdings = holdings
    this.historicPrices = historicPrices
    this.returns = returns
    this.asof = asof
    this.indicators = indicators
    this.realTimeDetails = realTimeDetails
  }

  static builder (isin: string) {
    return new Fund.Builder(isin)
  }

  isValid () {
    return !isEmpty(this.name) && !isEmpty(this.historicPrices)
  }
}

// eslint-disable-next-line no-redeclare
namespace Fund {
  export class Holding {
    name: string
    symbol: string
    weight: number
    constructor (name: string, symbol: string, weight: number) {
      this.name = name
      this.symbol = symbol
      this.weight = weight
    }
  }

  export class HistoricPrice {
    date: Date
    price: number
    constructor (date: Date, price: number) {
      this.date = date
      this.price = price
    }
  }

  export type Returns = { [lookback: string]: number }

  export interface RealTimeDetails {
    estChange: number,
    estPrice: number,
    stdev: number,
    ci: [number, number],
    holdings: { name: string, symbol: string, currency: string, todaysChange: number, weight: number}[]
    lastUpdated: Date
  }

  export class Builder {
    _amc: number
    _asof: Date
    _bidAskSpread: number
    _entryCharge: number
    _exitCharge: number
    _frequency: string
    _historicPrices: HistoricPrice[]
    _holdings: Holding[]
    _indicators: object
    _isin: string
    _name: string
    _ocf: number
    _realTimeDetails: RealTimeDetails
    _returns: Returns
    _sedol: string
    _shareClass: any
    _type: any
    constructor (isin: string) {
      this._isin = isin
    }

    sedol (sedol: string) {
      this._sedol = sedol
      return this
    }

    name (name: string) {
      this._name = name
      return this
    }

    type (type: any) {
      this._type = type
      return this
    }

    shareClass (shareClass: any) {
      this._shareClass = shareClass
      return this
    }

    frequency (frequency: string) {
      this._frequency = frequency
      return this
    }

    ocf (ocf: number) {
      this._ocf = ocf
      return this
    }

    amc (amc: number) {
      this._amc = amc
      return this
    }

    entryCharge (entryCharge: number) {
      this._entryCharge = entryCharge
      return this
    }

    exitCharge (exitCharge: number) {
      this._exitCharge = exitCharge
      return this
    }

    bidAskSpread (bidAskSpread: number) {
      this._bidAskSpread = bidAskSpread
      return this
    }

    holdings (holdings: Holding[]) {
      this._holdings = holdings
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

    build () {
      return new Fund(this._isin, this._sedol, this._name, this._type, this._shareClass, this._frequency,
        this._ocf, this._amc, this._entryCharge, this._exitCharge, this._bidAskSpread,
        this._holdings, this._historicPrices, this._returns, this._asof, this._indicators, this._realTimeDetails)
    }
  }
}

export default Fund
