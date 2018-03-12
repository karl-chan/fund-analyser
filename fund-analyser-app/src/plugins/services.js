import fundService from '../services/fund-service'

export default ({ Vue }) => {
  Vue.prototype.$services = { fundService }
}
