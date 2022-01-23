/* eslint-disable no-use-before-define */
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
  }

  constructor (
    public readonly base: string,
    public readonly quote: string,
    public readonly historicRates: Currency.HistoricRate[],
    public readonly returns: { [lookback: string]: number }
  ) { }
}

// eslint-disable-next-line no-redeclare
namespace Currency {
  export class HistoricRate {
    constructor (public readonly date: Date, public readonly rate: number) { }
  }
}

export default Currency
