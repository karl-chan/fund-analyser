export function setSupportedCurrencies (state, symbols) {
  state.supportedCurrencies = symbols
}

export function addCurrencies (state, currencies) {
  for (let currency of currencies) {
    const key = currency.base + currency.quote
    state.loaded = { ...state.loaded, [key]: currency }
  }
}
