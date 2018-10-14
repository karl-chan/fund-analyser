const UPDATE_INTERVAL = 120000 // every 2 minutes

export default (store) => {
  setInterval(() => store.dispatch('funds/updateRealTimeDetails'), UPDATE_INTERVAL)
}
