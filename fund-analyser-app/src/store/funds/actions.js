import fundService from './../../services/fund-service'

export const init = ({dispatch}) => {
  dispatch('summary')
}

export function get ({commit}, isin) {
  fundService.get(isin).then(fund => {
    commit('loadFund', fund)
  })
}

export function remove ({commit}, isin) {
  commit('removeFund', isin)
}

export const summary = ({commit}) => {
  fundService.summary().then(fundsSummary => commit('setSummary', fundsSummary))
}
