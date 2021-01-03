import * as properties from './properties'

import log from './log'
import * as stream from 'stream'
import ParallelTransform from 'parallel-transform'
import * as _ from 'lodash'
const maxParallelTransforms = properties.get('stream.max.parallel.transforms')

export function asReadableAsync (asyncFn: any) {
  let queue: any
  const readableStream = new stream.Readable({
    objectMode: true,
    async read (size: any) {
      if (queue === undefined) {
        // lazy initialise
        this.pause()
        try {
          queue = await asyncFn()
        } catch (err) {
          this.emit('error', err)
          return
        }
        if (Array.isArray(queue)) {
          queue.reverse()
        } else {
          queue = [queue]
        }
        this.resume()
      }
      let next
      while ((next = queue.pop()) !== undefined) {
        if (!this.push(next)) {
          this.resume()
          return
        }
      }
      this.push(null)
    }
  })
  cleanup(readableStream)
  return readableStream
}

export function asWritableAsync (asyncFn: any) {
  const writableStream = new stream.Writable({
    objectMode: true,
    async write (chunk: any, encoding: any, callback: any) {
      try {
        await asyncFn(chunk)
        return callback()
      } catch (err) {
        return callback(err)
      }
    }
  })
  cleanup(writableStream)
  return writableStream
}

export function asTransformAsync (asyncFn: any) {
  const transformStream = new stream.Transform({
    allowHalfOpen: false,
    objectMode: true,
    async transform (chunk: any, encoding: any, callback: any) {
      let data
      try {
        data = await asyncFn(chunk)
      } catch (err) {
        return callback(err)
      }
      if (_.isArray(data)) {
        for (const chunk of data) {
          this.push(chunk)
        }
      } else {
        this.push(data)
      }
      return callback()
    }
  })
  cleanup(transformStream)
  return transformStream
}

export function asFilterAsync (asyncFn: any) {
  const filterStream = new stream.Transform({
    allowHalfOpen: false,
    objectMode: true,
    async transform (chunk: any, encoding: any, callback: any) {
      let bool
      try {
        bool = await asyncFn(chunk)
      } catch (err) {
        return callback(err)
      }
      if (bool) {
        this.push(chunk)
      }
      return callback()
    }
  })
  cleanup(filterStream)
  return filterStream
}

/**
 * Warning: wrapped function needs to be single output per input
 * @param asyncFn
 * @returns {ParallelTransform}
 */
export function asParallelTransformAsync (asyncFn: any) {
  const parallelTransformStream = new ParallelTransform(maxParallelTransforms, async (chunk: any, callback: any) => {
    let data
    try {
      data = await asyncFn(chunk)
    } catch (err) {
      return callback(err)
    }
    return callback(null, data)
  })
  cleanup(parallelTransformStream)
  return parallelTransformStream
}

function cleanup (s: any) {
  stream.finished(s, (err: any) => {
    if (err) {
      log.error(err.stack)
      process.exit(1) // must exit immediately otherwise extremely hard to debug
    }
  })
}
