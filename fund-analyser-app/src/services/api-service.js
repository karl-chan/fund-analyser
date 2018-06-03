import axios from 'axios'
import store from './../store'

const defaults = {
  baseURL: '/api'
}

// hacky way to evict user from single page application
const handleUnauthorised = (err) => {
  if (err.response.status === 401) {
    store.dispatch('auth/removeUser')
  }
  throw err
}

export default {
  get (url, config) {
    return axios
      .get(url, {...defaults, ...config})
      .then(res => res.data)
      .catch(handleUnauthorised)
  },
  post (url, data, config) {
    return axios
      .post(url, data, {...defaults, ...config})
      .then(res => res.data)
      .catch(handleUnauthorised)
  },
  delete (url, config) {
    return axios
      .delete(url, {...defaults, ...config})
      .then(res => res.data)
      .catch(handleUnauthorised)
  }
}
