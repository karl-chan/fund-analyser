import axios from 'axios'

const REMOTE_API_HOST = 'https://fund-analyser.herokuapp.com'

const apiHost = process.env.NODE_ENV === 'production' ? REMOTE_API_HOST : ''

const defaults = {
  baseURL: apiHost + '/api'
}

export default {
  get (url, config) {
    return axios.get(url, {...defaults, ...config}).then(res => res.data)
  }
}
