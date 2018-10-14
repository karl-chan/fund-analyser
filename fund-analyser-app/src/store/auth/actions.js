import authService from './../../services/auth-service'
import dateUtils from './../../utils/date-utils'

export async function init ({ dispatch }) {
  await Promise.all([
    dispatch('getAuth'),
    dispatch('getActiveSessions')
  ])
}

export function removeUser ({ commit }) {
  commit('setUser', null)
}

export async function login ({ commit, dispatch }, { user, pass, memorableWord, persist }) {
  const { user: name } = await authService.login(user, pass, memorableWord, persist)
  commit('setUser', name)
  dispatch('getActiveSessions')
  dispatch('account/init', null, { root: true })
}

export async function logout ({ dispatch, commit }) {
  await authService.logout()
  dispatch('removeUser')
  dispatch('getActiveSessions')
  commit('account/reset', null, { root: true })
}

export async function getAuth ({ commit }) {
  const { user } = await authService.getAuth()
  commit('setUser', user)
}

export async function getActiveSessions ({ commit }) {
  const sessions = await authService.getSessions()
  const activeSessions = sessions.filter(s => dateUtils.isAfterNow(s.expiry))
  commit('setActiveSessions', activeSessions)
}

export async function destroySession ({ dispatch }, encryptedId) {
  await authService.destroySession(encryptedId)
  dispatch('getActiveSessions')
}
