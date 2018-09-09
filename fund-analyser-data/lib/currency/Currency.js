class Currency {
    constructor (base, quote, historicRates) {
        this.base = base
        this.quote = quote
        this.historicRates = historicRates
    }
}

Currency.HistoricRate = class {
    constructor (date, rate) {
        this.date = date
        this.rate = rate
    }
}

module.exports = Currency
