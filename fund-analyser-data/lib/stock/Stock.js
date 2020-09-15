const _ = require('lodash')

class Stock {
    constructor (symbol, name, historicPrices, returns, asof, indicators, realTimeDetails) {
        this.symbol = symbol
        this.name = name
        this.historicPrices = historicPrices
        this.returns = returns
        this.asof = asof
        this.indicators = indicators
        this.realTimeDetails = realTimeDetails
    }

    static Builder (symbol) {
        return new Builder(symbol)
    }

    isValid () {
        return !_.isEmpty(this.name) && !_.isEmpty(this.historicPrices)
    }
}

Stock.schema = {
    symbol: 'string',
    name: 'string',
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
}

Stock.HistoricPrice = class {
    constructor (date, open, high, low, close, volume) {
        this.date = date
        this.open = open
        this.high = high
        this.low = low
        this.close = close
        this.volume = volume
    }
}

class Builder {
    constructor (symbol) {
        this._symbol = symbol
    }

    symbol (symbol) {
        this._symbol = symbol
        return this
    }

    name (name) {
        this._name = name
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
        return new Stock(this._symbol, this._name, this._historicPrices, this._returns, this._asof, this._indicators, this._realTimeDetails)
    }
}

module.exports = Stock
