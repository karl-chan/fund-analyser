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

  constructor (
    public readonly isin: string,
    public readonly sedol: string,
    public readonly name: string,
    public readonly type: any,
    public readonly shareClass: any,
    public readonly frequency: string,
    public readonly ocf: number,
    public readonly amc: number,
    public readonly entryCharge: number,
    public readonly exitCharge: number,
    public readonly bidAskSpread: number,
    public readonly holdings: Fund.Holding[],
    public readonly historicPrices: Fund.HistoricPrice[],
    public readonly returns: Fund.Returns,
    public readonly asof: Date,
    public readonly indicators: object,
    public readonly realTimeDetails: Fund.RealTimeDetails
  ) {}

  static builder (isin: string) {
    return new Fund.Builder(isin)
  }

  isValid () {
    return !isEmpty(this.name) && !isEmpty(this.historicPrices)
  }

  toBuilder () {
    return Fund.builder(this.isin)
      .sedol(this.sedol)
      .name(this.name)
      .type(this.type)
      .shareClass(this.shareClass)
      .frequency(this.frequency)
      .ocf(this.ocf)
      .amc(this.amc)
      .entryCharge(this.entryCharge)
      .exitCharge(this.exitCharge)
      .bidAskSpread(this.bidAskSpread)
      .holdings(this.holdings)
      .historicPrices(this.historicPrices)
      .returns(this.returns)
      .asof(this.asof)
      .indicators(this.indicators)
      .realTimeDetails(this.realTimeDetails)
  }
}

// eslint-disable-next-line no-redeclare
namespace Fund {
  export class Holding {
    constructor (public readonly name: string, public readonly symbol: string, public readonly weight: number) { }
  }

  export class HistoricPrice {
    constructor (public readonly date: Date, public readonly price: number) { }
  }

  export type Returns = { [lookback: string]: number }

  export interface RealTimeDetails {
    estChange: number,
    estPrice: number,
    stdev: number,
    ci: [number, number],
    holdings: { name: string, symbol: string, currency: string, todaysChange: number, weight: number }[]
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
