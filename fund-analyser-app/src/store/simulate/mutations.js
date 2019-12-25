import isEqual from 'lodash/isEqual'

export function addSimulation (state, simulation) {
  const oldIndex = state.loadedSimulations.findIndex(s => isEqual(s.simulateParam, simulation.simulateParam))

  if (oldIndex === -1) {
    state.loadedSimulations.push(simulation)
  } else {
    state.loadedSimulations.splice(oldIndex, 1, simulation)
  }
}

export function setSupportedStrategies (state, strategies) {
  state.supportedStrategies = strategies
}
