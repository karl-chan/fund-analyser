export function setSupportedCurrencies (state, symbols) {
  state.supportedCurrencies = symbols
}

export function addCurrencies (state, currencies) {
  for (const currency of currencies) {
    const key = currency.base + currency.quote
    state.loaded = { ...state.loaded, [key]: currency }
  }
}

export function setSummary (state, summary) {
  state.summary = summary
}
