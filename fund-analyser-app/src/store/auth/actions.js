import authService from './../../services/auth-service'

export async function init ({commit}) {
  await authService
    .getAuth()
    .then(({user}) => commit('setUser', user))
}

export function removeUser ({commit}) {
  commit('setUser', null)
}

export async function login ({commit}, {user, pass, memorableWord, persist}) {
  await authService
    .login(user, pass, memorableWord, persist)
    .then(({user}) => commit('setUser', user))
}

export async function logout ({dispatch}) {
  await authService
    .logout()
    .then(() => dispatch('removeUser'))
}
