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

module.exports = Currency
