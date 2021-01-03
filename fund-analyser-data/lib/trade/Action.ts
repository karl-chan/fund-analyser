export class Buy {
    isin: any;
    sedol: any;
    value: any;
    constructor (isin: any, sedol: any, value: any) {
      this.isin = isin
      this.sedol = sedol
      this.value = value
    }
}
export class Sell {
    isin: any;
    quantity: any;
    sedol: any;
    constructor (isin: any, sedol: any, quantity: any) {
      this.isin = isin
      this.sedol = sedol
      this.quantity = quantity
    }
}
