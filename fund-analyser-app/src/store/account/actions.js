import accountService from './../../services/account-service'

export async function getBalance ({commit, dispatch}) {
  await accountService.getBalance()
    .then(({balance}) => {
      commit('saveCsdBalance', balance)
    })
}
