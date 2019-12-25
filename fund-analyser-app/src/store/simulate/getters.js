import isEqual from 'lodash/isEqual'

export function lookupSimulations (state) {
  return param => state.loadedSimulations.find(s => isEqual(s.simulateParam, param))
}
