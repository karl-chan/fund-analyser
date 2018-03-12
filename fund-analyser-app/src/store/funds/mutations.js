export const loadFund = (state, fund) => {
  // replace with new record
  state.loaded = [fund, ...state.loaded.filter(f => f.isin !== fund.isin)]
}

export const removeFund = (state, isin) => {
  state.loaded = state.loaded.filter(f => f.isin !== isin)
}

export const setSummary = (state, fundsSummary) => {
  state.summary = fundsSummary
}
