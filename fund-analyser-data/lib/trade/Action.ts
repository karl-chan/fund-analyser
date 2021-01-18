export class Buy {
    isin: string;
    sedol: string;
    value: number;
    constructor (isin: string, sedol: string, value: number) {
      this.isin = isin
      this.sedol = sedol
      this.value = value
    }
}
export class Sell {
    isin: string;
    quantity: number;
    sedol: string;
    constructor (isin: string, sedol: string, quantity: number) {
      this.isin = isin
      this.sedol = sedol
      this.quantity = quantity
    }
}

export type Action = Buy | Sell;
