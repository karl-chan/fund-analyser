export function lookupStock (state) {
  return symbol => state.loaded[symbol]
}
