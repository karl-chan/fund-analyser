import adminService from '../../services/admin-service'

export async function doHealthcheck ({ commit }) {
  const health = await adminService.healthcheck()
  commit('setHealth', health)
}
