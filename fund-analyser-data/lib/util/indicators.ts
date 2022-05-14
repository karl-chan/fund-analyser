import * as compute from '../../client/compute'
import Fund from '../fund/Fund'
import Stock from '../stock/Stock'

export async function calcFundIndicators (fund: Fund): Promise<Fund.Indicators> {
  const { historicPrices, ...restFund } = fund
  return compute.post('indicators/fund', {
    fund: restFund,
    historicPrices
  })
}

export async function calcStockIndicators (stock: Stock): Promise<Stock.Indicators> {
  const { historicPrices, ...restStock } = stock
  return compute.post('indicators/stock', {
    stock: restStock,
    historicPrices
  })
}
