class Currency {
    static schema = {
      base: 'string',
      quote: 'string',
      historicRates: 'Array',
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
        '1D': 'number'
      }
    };

    base: string;
    historicRates: Currency.HistoricRate[];
    quote: string;
    returns: {[lookback: string]: number};

    constructor (base: string, quote: string, historicRates: Currency.HistoricRate[], returns:{[lookback: string]: number}) {
      this.base = base
      this.quote = quote
      this.historicRates = historicRates
      this.returns = returns
    }
}

// eslint-disable-next-line no-redeclare
namespace Currency {
    export class HistoricRate {
        date: Date;
        rate: number;
        constructor (date: Date, rate: number) {
          this.date = date
          this.rate = rate
        }
    }
}

export default Currency
