import moment from 'moment'
import 'moment-duration-format'

export default class Stopwatch {
  _startTime: number
  _splitTime: number

  constructor () {
    this.start()
  }

  start () {
    const now = Date.now()
    this._startTime = now
    this._splitTime = now
  }

  split () {
    const now = Date.now()
    const elapsed = now - this._splitTime
    this._splitTime = now
    return Stopwatch.formatDuration(elapsed)
  }

  end () {
    const now = Date.now()
    const elapsedSinceStart = now - this._startTime
    this._startTime = undefined
    this._splitTime = undefined
    return Stopwatch.formatDuration(elapsedSinceStart)
  }

  static formatDuration (ms: any) {
    const formatString = 'h[h] m[m] s[s]'
    return moment.duration(ms, 'ms').format(formatString)
  }
}
