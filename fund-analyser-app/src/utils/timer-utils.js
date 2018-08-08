export default {
  log (event, func) {
    console.time(event)
    const result = func()
    console.timeEnd(event)
    return result
  }
}
