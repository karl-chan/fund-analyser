import keyBy from 'lodash/keyBy'
import Vue from 'vue'

export function addStocks (state, stocks) {
  const symbolsToStocks = keyBy(stocks, s => s.symbol)
  state.loaded = { ...state.loaded, ...symbolsToStocks }
}

export function removeStock (state, symbol) {
  Vue.delete(state.loaded, symbol)
}

export function removeAllStocks (state) {
  state.loaded = {}
}

export function setRealTimeDetails (state, realTimeDetailsPairs) {
  for (const [symbol, realTimeDetails] of realTimeDetailsPairs) {
    if (symbol in state.loaded) {
      state.loaded[symbol].realTimeDetails = {
        ...state.loaded[symbol].realTimeDetails,
        realTimeDetails
      }
    }
  }
}

export function setSummary (state, stocksSummary) {
  state.summary = stocksSummary
}

export function setIndicatorSchema (state, indicatorSchema) {
  state.indicatorSchema = indicatorSchema
}
