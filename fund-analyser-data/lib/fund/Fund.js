module.exports = Fund

const _ = require('lodash')

Fund.types = Object.freeze({
    OEIC: 'OEIC',
    UNIT: 'UNIT'
})

Fund.shareClasses = Object.freeze({
    INC: 'Inc',
    ACC: 'Acc'
})

function Fund (isin, sedol, name, type, shareClass, frequency, ocf, amc, entryCharge, exitCharge, bidAskSpread, holdings, historicPrices, returns, percentiles, asof, stability, realTimeDetails) {
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
    this.percentiles = percentiles
    this.asof = asof
    this.stability = stability
    this.realTimeDetails = realTimeDetails
}

Fund.prototype.isValid = function () {
    return !_.isEmpty(this.name)
}

Fund.prototype.equals = function (o) {
    if (!(o instanceof Fund)) {
        return false
    }
    return _.isEqual(this, o)
}

Fund.Builder = function (optionalIsin) {
    return new FundBuilder(optionalIsin)
}

Fund.Holding = function (name, symbol, weight) {
    return new Holding(name, symbol, weight)
}

Fund.HistoricPrice = function (date, price) {
    return new HistoricPrice(date, price)
}

function FundBuilder (isin) {
    if (isin) {
        this._isin = isin
    }
}

FundBuilder.prototype.sedol = function (sedol) {
    this._sedol = sedol
    return this
}

FundBuilder.prototype.name = function (name) {
    this._name = name
    return this
}

FundBuilder.prototype.type = function (type) {
    this._type = type
    return this
}

FundBuilder.prototype.shareClass = function (shareClass) {
    this._shareClass = shareClass
    return this
}

FundBuilder.prototype.frequency = function (frequency) {
    this._frequency = frequency
    return this
}

FundBuilder.prototype.ocf = function (ocf) {
    this._ocf = ocf
    return this
}

FundBuilder.prototype.amc = function (amc) {
    this._amc = amc
    return this
}

FundBuilder.prototype.entryCharge = function (entryCharge) {
    this._entryCharge = entryCharge
    return this
}

FundBuilder.prototype.exitCharge = function (exitCharge) {
    this._exitCharge = exitCharge
    return this
}

FundBuilder.prototype.bidAskSpread = function (bidAskSpread) {
    this._bidAskSpread = bidAskSpread
    return this
}

FundBuilder.prototype.holdings = function (holdings) {
    this._holdings = holdings
    return this
}

FundBuilder.prototype.historicPrices = function (historicPrices) {
    this._historicPrices = historicPrices
    return this
}

FundBuilder.prototype.returns = function (returns) {
    this._returns = returns
    return this
}

FundBuilder.prototype.percentiles = function (percentiles) {
    this._percentiles = percentiles
    return this
}

FundBuilder.prototype.asof = function (asof) {
    this._asof = asof
    return this
}

FundBuilder.prototype.stability = function (stability) {
    this._stability = stability
    return this
}

FundBuilder.prototype.realTimeDetails = function (realTimeDetails) {
    this._realTimeDetails = realTimeDetails
    return this
}

FundBuilder.prototype.build = function () {
    return new Fund(this._isin, this._sedol, this._name, this._type, this._shareClass, this._frequency,
        this._ocf, this._amc, this._entryCharge, this._exitCharge, this._bidAskSpread,
        this._holdings, this._historicPrices, this._returns, this._percentiles, this._asof, this._stability, this._realTimeDetails)
}

function Holding (name, symbol, weight) {
    this.name = name
    this.symbol = symbol
    this.weight = weight
}

function HistoricPrice (date, price) {
    this.date = date
    this.price = price
}
