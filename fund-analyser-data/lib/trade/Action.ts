export class Buy {
  constructor (public readonly isin: string, public readonly sedol: string, public readonly value: number) {}
}
export class Sell {
  constructor (public readonly isin: string, public readonly sedol: string, public readonly quantity: number) {}
}

export type Action = Buy | Sell;
