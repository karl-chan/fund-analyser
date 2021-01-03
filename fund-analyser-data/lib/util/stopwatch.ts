import moment from 'moment'
import 'moment-duration-format'

export default class Stopwatch {
   _startTime: Date
   _splitTime: Date

   constructor () {
     this.start()
   }

   start () {
     const now = new Date()
     this._startTime = now
     this._splitTime = now
   }

   split () {
     const now = new Date()
     // @ts-expect-error ts-migrate(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
     const elapsed = now - this._splitTime
     this._splitTime = now
     return Stopwatch.formatDuration(elapsed)
   }

   end () {
     const now = new Date()
     // @ts-expect-error ts-migrate(2362) FIXME: The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
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
