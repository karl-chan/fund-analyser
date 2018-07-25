import miscService from './../../services/misc-service'

export async function doHealthcheck ({commit}) {
  const health = await miscService.healthcheck()
  commit('setHealth', health)
}
