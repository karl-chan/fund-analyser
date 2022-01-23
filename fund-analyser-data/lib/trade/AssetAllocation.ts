import * as _ from 'lodash'

export class Holding {
  constructor (
    public readonly isin: string,
    public readonly sedol: string,
    public readonly weight: number
  ) { this.checkError() }

  private checkError () {
    if (this.weight < 0 || this.weight > 1) {
      throw new Error(`Weight must be between 0 and 1, but got: ${this.weight}!`)
    }
  }
}

export class AssetAllocation {
  constructor (public readonly holdings: Holding[]) { this.checkError() }

  private checkError () {
    const totalWeight = _.sumBy(this.holdings, h => h.weight)
    if (totalWeight > 1) {
      throw new Error(`Holdings must weight up to less than 1, but got ${totalWeight} for holdings: ${JSON.stringify(this.holdings)}!`)
    }
  }
}
