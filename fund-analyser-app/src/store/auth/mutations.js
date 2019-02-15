export function setUser (state, user) {
  state.user = user
}

export function setActiveSessions (state, sessions) {
  state.activeSessions = sessions
}

export function reset (state) {
  state.user = null
  state.activeSessions = []
}
