class Currency {
    constructor (base, quote, historicRates, returns) {
        this.base = base
        this.quote = quote
        this.historicRates = historicRates
        this.returns = returns
    }
}

Currency.HistoricRate = class {
    constructor (date, rate) {
        this.date = date
        this.rate = rate
    }
}

Currency.schema = {
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

module.exports = Currency
