class Buy {
    constructor (isin, sedol, value) {
        this.isin = isin
        this.sedol = sedol
        this.value = value
    }
}
class Sell {
    constructor (isin, sedol, quantity) {
        this.isin = isin
        this.sedol = sedol
        this.quantity = quantity
    }
}

module.exports = {
    Buy,
    Sell
}
