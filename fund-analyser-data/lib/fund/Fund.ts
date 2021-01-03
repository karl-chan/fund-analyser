import { isEmpty } from 'lodash'
class Fund {
    static types = Object.freeze({
      OEIC: 'OEIC',
      UNIT: 'UNIT'
    });

    static shareClasses = Object.freeze({
      INC: 'Inc',
      ACC: 'Acc'
    });

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
        holdings: 'Array'
      }
    };

    amc: any;
    asof: any;
    bidAskSpread: any;
    entryCharge: any;
    exitCharge: any;
    frequency: any;
    historicPrices: Fund.HistoricPrice[];
    holdings: Fund.Holding[];
    indicators: any;
    isin: any;
    name: any;
    ocf: any;
    realTimeDetails: any;
    returns: object;
    sedol: any;
    shareClass: any;
    type: any;

    constructor (isin: any, sedol: any, name: any, type: any, shareClass: any, frequency: any, ocf: any, amc: any, entryCharge: any, exitCharge: any, bidAskSpread: any, holdings: Fund.Holding[], historicPrices: Fund.HistoricPrice[], returns: object, asof: any, indicators: any, realTimeDetails: any) {
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
        name: any;
        symbol: any;
        weight: any;
        constructor (name: any, symbol: any, weight: any) {
          this.name = name
          this.symbol = symbol
          this.weight = weight
        }
    }

    export class HistoricPrice {
        date: any;
        price: any;
        constructor (date: any, price: any) {
          this.date = date
          this.price = price
        }
    }

    export class Builder {
        _amc: any;
        _asof: any;
        _bidAskSpread: any;
        _entryCharge: any;
        _exitCharge: any;
        _frequency: any;
        _historicPrices: any;
        _holdings: any;
        _indicators: any;
        _isin: any;
        _name: any;
        _ocf: any;
        _realTimeDetails: any;
        _returns: any;
        _sedol: any;
        _shareClass: any;
        _type: any;
        constructor (isin: any) {
          this._isin = isin
        }

        sedol (sedol: any) {
          this._sedol = sedol
          return this
        }

        name (name: any) {
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

        frequency (frequency: any) {
          this._frequency = frequency
          return this
        }

        ocf (ocf: any) {
          this._ocf = ocf
          return this
        }

        amc (amc: any) {
          this._amc = amc
          return this
        }

        entryCharge (entryCharge: any) {
          this._entryCharge = entryCharge
          return this
        }

        exitCharge (exitCharge: any) {
          this._exitCharge = exitCharge
          return this
        }

        bidAskSpread (bidAskSpread: any) {
          this._bidAskSpread = bidAskSpread
          return this
        }

        holdings (holdings: any) {
          this._holdings = holdings
          return this
        }

        historicPrices (historicPrices: any) {
          this._historicPrices = historicPrices
          return this
        }

        returns (returns: any) {
          this._returns = returns
          return this
        }

        asof (asof: any) {
          this._asof = asof
          return this
        }

        indicators (indicators: any) {
          this._indicators = indicators
          return this
        }

        realTimeDetails (realTimeDetails: any) {
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
