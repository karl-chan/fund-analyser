export function openDrawer ({ commit }) {
  commit('setDrawerOpen', true)
}

export function closeDrawer ({ commit }) {
  commit('setDrawerOpen', false)
}

export function toggleDrawer ({ commit, state }) {
  commit('setDrawerOpen', !state.drawerOpen)
}
