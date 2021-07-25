import keyBy from 'lodash/keyBy'

export function addFunds (state, funds) {
  const isinsToFunds = keyBy(funds, f => f.isin)
  state.loaded = { ...state.loaded, ...isinsToFunds }
}

export function removeFund (state, isin) {
  delete state.loaded[isin]
}

export function removeAllFunds (state) {
  state.loaded = {}
}

export function addSimilarFunds (state, similarFunds) {
  const isinsToSimilarFunds = keyBy(similarFunds, similarFundsEntry => similarFundsEntry.isin)
  state.loadedSimilarFunds = { ...state.loadedSimlarFunds, ...isinsToSimilarFunds }
}

export function setRealTimeDetails (state, realTimeDetailsPairs) {
  for (const [isin, realTimeDetails] of realTimeDetailsPairs) {
    if (isin in state.loaded) {
      state.loaded[isin].realTimeDetails = realTimeDetails
    }
  }
}

export function setSummary (state, fundsSummary) {
  state.summary = fundsSummary
}

export function setIndicatorSchema (state, indicatorSchema) {
  state.indicatorSchema = indicatorSchema
}
