import Vue from 'vue'

export function saveCsdBalance (state, balance) {
  Vue.set(state.charlesStanleyDirect, 'balance', balance)
}
