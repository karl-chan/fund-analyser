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
                    if (!Array.isArray(queue)) {
                        queue = [queue]
                    }
                    queue.reverse()
                } catch (err) {
                    this.emit('error', err)
                }
                this.resume()
            }
            let next
            while ((next = queue.pop()) !== undefined) {
                if (!this.push(next)) {
                    return
                }
            }
            this.push(null)
        }
    })
    readableStream.on('error', function (err) {
        log.error(err)
        throw err
    })
    return readableStream
}

function asWritableAsync (asyncFn) {
    const writableStream = new stream.Writable({
        objectMode: true,
        async  write (chunk, encoding, callback) {
            try {
                await asyncFn(chunk)
                callback()
            } catch (err) {
                this.emit('error', err)
                callback(err)
            }
        }
    })
    writableStream.on('error', function (err) {
        log.error(err)
        throw err
    })
    return writableStream
}

function asTransformAsync (asyncFn) {
    const transformStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        async transform (chunk, encoding, callback) {
            try {
                const data = await asyncFn(chunk)
                if (_.isArray(data)) {
                    for (let chunk of data) {
                        this.push(chunk)
                    }
                } else {
                    this.push(data)
                }
            } catch (err) {
                this.destroy(err)
                return
            }
            callback()
        }
    })
    transformStream.on('error', function (err) {
        log.error(err)
        throw err
    })
    return transformStream
}

function asFilterAsync (asyncFn) {
    const filterStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        async transform (chunk, encoding, callback) {
            try {
                const bool = await asyncFn(chunk)
                if (bool) {
                    this.push(chunk)
                }
                callback()
            } catch (err) {
                this.emit('error', err)
                callback(err)
            }
        }
    })
    filterStream.on('error', function (err) {
        log.error(err)
        throw err
    })
    return filterStream
}

/**
 * Warning: wrapped function needs to be single output per input
 * @param asyncFn
 * @returns {ParallelTransform}
 */
function asParallelTransformAsync (asyncFn) {
    const parallelTransformStream = new ParallelTransform(maxParallelTransforms, async (chunk, callback) => {
        try {
            const data = await asyncFn(chunk)
            callback(null, data)
        } catch (err) {
            callback(err)
        }
    })
    parallelTransformStream.on('error', function (err) {
        log.error(err)
        throw err
    })
    return parallelTransformStream
}
