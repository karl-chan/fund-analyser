import * as compute from '../../client/compute'

export async function calcFundIndicators (fund: any) {
  const { historicPrices, ...restFund } = fund
  return compute.post('indicators/fund', {
    fund: restFund,
    historicPrices
  })
}

export async function calcStockIndicators (stock: any) {
  const { historicPrices, ...restStock } = stock
  return compute.post('indicators/stock', {
    stock: restStock,
    historicPrices
  })
}
