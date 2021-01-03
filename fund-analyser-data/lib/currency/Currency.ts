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

    base: any;
    historicRates: Currency.HistoricRate[];
    quote: any;
    returns: any;

    constructor (base: any, quote: any, historicRates: Currency.HistoricRate[], returns: any) {
      this.base = base
      this.quote = quote
      this.historicRates = historicRates
      this.returns = returns
    }
}

// eslint-disable-next-line no-redeclare
namespace Currency {
    export class HistoricRate {
        date: any;
        rate: any;
        constructor (date: any, rate: any) {
          this.date = date
          this.rate = rate
        }
    }
}

export default Currency
