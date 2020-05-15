module.exports = {
    asReadableAsync,
    asWritableAsync,
    asTransformAsync,
    asFilterAsync,
    asParallelTransformAsync
}

const properties = require('./properties.js')
const maxParallelTransforms = properties.get('stream.max.parallel.transforms')

const log = require('./log.js')
const stream = require('stream')
const ParallelTransform = require('parallel-transform')
const _ = require('lodash')

function asReadableAsync (asyncFn) {
    let queue
    const readableStream = new stream.Readable({
        objectMode: true,
        async read (size) {
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

function asWritableAsync (asyncFn) {
    const writableStream = new stream.Writable({
        objectMode: true,
        async write (chunk, encoding, callback) {
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

function asTransformAsync (asyncFn) {
    const transformStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        async transform (chunk, encoding, callback) {
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

function asFilterAsync (asyncFn) {
    const filterStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        async transform (chunk, encoding, callback) {
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
function asParallelTransformAsync (asyncFn) {
    const parallelTransformStream = new ParallelTransform(maxParallelTransforms, async (chunk, callback) => {
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

function cleanup (s) {
    stream.finished(s, err => {
        if (err) {
            log.error(err.stack)
            process.exit(1) // must exit immediately otherwise extremely hard to debug
        }
    })
}
