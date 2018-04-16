import authService from './../../services/auth-service'
import dateUtils from './../../utils/date-utils'

export async function init ({dispatch}) {
  await Promise.all([
    dispatch('getAuth'),
    dispatch('getActiveSessions')
  ])
}

export function removeUser ({commit}) {
  commit('setUser', null)
}

export async function login ({commit, dispatch}, {user, pass, memorableWord, persist}) {
  await authService
    .login(user, pass, memorableWord, persist)
    .then(({user}) => commit('setUser', user))
    .then(() => dispatch('getActiveSessions'))
}

export async function logout ({dispatch}) {
  await authService
    .logout()
    .then(() => dispatch('removeUser'))
    .then(() => dispatch('getActiveSessions'))
}

export async function getAuth ({commit}) {
  await authService
    .getAuth()
    .then(({user}) => commit('setUser', user))
}

export async function getActiveSessions ({commit}) {
  await authService
    .getSessions()
    .then(sessions => sessions.filter(s => dateUtils.isAfterNow(s.expiry)))
    .then(sessions => commit('setActiveSessions', sessions))
}

export async function destroySession ({dispatch}, encryptedId) {
  await authService
    .destroySession(encryptedId)
    .then(() => dispatch('getActiveSessions'))
}
