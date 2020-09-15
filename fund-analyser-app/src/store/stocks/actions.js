import stockService from './../../services/stock-service'

export async function init ({ commit }) {
  const indicatorSchema = await stockService.getIndicatorSchema()
  commit('setIndicatorSchema', indicatorSchema)
}
