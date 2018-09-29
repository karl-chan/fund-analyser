const UPDATE_INTERVAL = 60000 // every 1 minute

export default (store) => {
  setInterval(() => store.dispatch('funds/updateRealTimeDetails'), UPDATE_INTERVAL)
}
