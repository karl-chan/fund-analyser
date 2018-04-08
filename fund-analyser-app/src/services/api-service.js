import axios from 'axios'
import store from './../store'

const REMOTE_API_HOST = 'https://fund-analyser.herokuapp.com'

const apiHost = process.env.NODE_ENV === 'production' ? REMOTE_API_HOST : ''

const defaults = {
  baseURL: apiHost + '/api'
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
  }
}
