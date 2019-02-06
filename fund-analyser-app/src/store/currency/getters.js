export function lookupCurrency (state) {
  return currency => state.loaded[currency]
}
