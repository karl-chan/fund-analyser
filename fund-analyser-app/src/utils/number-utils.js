export default {
  numberComparator (a, b) {
    if (a === '-' && b === '-') {
      return 0
    }
    if (a === '-') {
      return -1
    }
    if (b === '-') {
      return 1
    }
    return a - b
  }
}
