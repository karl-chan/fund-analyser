import simulateService from '../../services/simulate-service'
import dateUtils from './../../utils/date-utils'

export async function init ({ dispatch }) {
  dispatch('getSupportedStrategies')
}

export async function simulate ({ commit }, simulateParam) {
  const simulateResponse = await simulateService.simulate(simulateParam)
  const simulation = { simulateParam, simulateResponse }
  commit('addSimulation', simulation)
  return simulation
}

export async function predict ({ commit }, { simulateParam, date }) {
  const prediction = await simulateService.predict(simulateParam, date)
  return prediction
}

export async function lazySimulate ({ dispatch, getters }, simulateParam) {
  const cachedSimulation = getters['lookupSimulations'](simulateParam)
  const upToDate = cachedSimulation && !dateUtils.isBeforeToday(cachedSimulation.simulateResponse.date)
  return upToDate ? cachedSimulation : dispatch('simulate', simulateParam)
}

export async function getSupportedStrategies ({ commit }) {
  const strategies = await simulateService.getSupportedStrategies()
  commit('setSupportedStrategies', strategies)
}
