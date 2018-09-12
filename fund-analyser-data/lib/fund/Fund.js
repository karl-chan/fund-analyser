const _ = require('lodash')

class Fund {
    constructor (isin, sedol, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge, bidAskSpread, holdings, historicPrices, returns, asof, indicators, realTimeDetails) {
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

    static Builder (isin) {
        return new Builder(isin)
    }

    isValid () {
        return !_.isEmpty(this.name)
    }
}

Fund.types = Object.freeze({
    OEIC: 'OEIC',
    UNIT: 'UNIT'
})

Fund.shareClasses = Object.freeze({
    INC: 'Inc',
    ACC: 'Acc'
})
Fund.Holding = class {
    constructor (name, symbol, weight) {
        this.name = name
        this.symbol = symbol
        this.weight = weight
    }
}

Fund.HistoricPrice = class {
    constructor (date, price) {
        this.date = date
        this.price = price
    }
}

class Builder {
    constructor (isin) {
        this._isin = isin
    }

    sedol (sedol) {
        this._sedol = sedol
        return this
    }

    name (name) {
        this._name = name
        return this
    }

    type (type) {
        this._type = type
        return this
    }

    shareClass (shareClass) {
        this._shareClass = shareClass
        return this
    }

    frequency (frequency) {
        this._frequency = frequency
        return this
    }

    ocf (ocf) {
        this._ocf = ocf
        return this
    }

    amc (amc) {
        this._amc = amc
        return this
    }

    entryCharge (entryCharge) {
        this._entryCharge = entryCharge
        return this
    }

    exitCharge (exitCharge) {
        this._exitCharge = exitCharge
        return this
    }

    bidAskSpread (bidAskSpread) {
        this._bidAskSpread = bidAskSpread
        return this
    }

    holdings (holdings) {
        this._holdings = holdings
        return this
    }

    historicPrices (historicPrices) {
        this._historicPrices = historicPrices
        return this
    }

    returns (returns) {
        this._returns = returns
        return this
    }

    asof (asof) {
        this._asof = asof
        return this
    }

    indicators (indicators) {
        this._indicators = indicators
        return this
    }

    realTimeDetails (realTimeDetails) {
        this._realTimeDetails = realTimeDetails
        return this
    }

    build () {
        return new Fund(this._isin, this._sedol, this._name, this._type, this._shareClass, this._frequency,
            this._ocf, this._amc, this._entryCharge, this._exitCharge, this._bidAskSpread,
            this._holdings, this._historicPrices, this._returns, this._asof, this._indicators, this._realTimeDetails)
    }
}

module.exports = Fund
