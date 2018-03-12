/*
export const someGetter = (state) => {}
 */

export const lookupFund = state => isin => {
  return state.loaded.find(f => f.isin === isin)
}
