import axios from 'axios'

const GET_ENDPOINT = '/get'
const SUMMARY_ENDPOINT = '/summary'
const SEARCH_ENDPOINT = '/search'
const REAL_TIME_DETAILS_ENDPOINT = '/real-time-details'

export default {
  get (isin) {
    return get(`${GET_ENDPOINT}/${isin}`)
  },
  search (searchText) {
    return get(`${SEARCH_ENDPOINT}/${searchText}`)
  },
  summary () {
    return get(SUMMARY_ENDPOINT)
  },
  getRealTimeDetails (fund) {
    return post(`${REAL_TIME_DETAILS_ENDPOINT}`, {fund})
  }
}

const get = (url) => {
  return axios.get(url, {baseURL: '/api/funds'})
    .then(res => res.data)
}

const post = (url, body) => {
  return axios.post(url, body, {baseURL: '/api/funds'})
    .then(res => res.data)
}
