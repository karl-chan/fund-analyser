module.exports = {
    asWritable,
    asTransform,
    asFilter,
    asParallelTransform,

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

function asWritable (fn) {
    const writableStream = new stream.Writable({
        objectMode: true,
        write (chunk, encoding, callback) {
            fn(chunk, (err, data) => {
                if (err) {
                    this.emit('error', err)
                    return callback(err)
                }
                return callback()
            })
        }
    })
    writableStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return writableStream
}

function asTransform (fn) {
    const transformStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        transform (chunk, encoding, callback) {
            fn(chunk, (err, data) => {
                if (err) {
                    this.emit('error', err)
                    return callback(err)
                }
                if (_.isArray(data)) {
                    _.forEach(data, (chunk) => {
                        this.push(chunk)
                    })
                } else {
                    this.push(data)
                }
                return callback()
            })
        }
    })
    transformStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return transformStream
}

function asFilter (fn) {
    const filterStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        transform (chunk, encoding, callback) {
            fn(chunk, (err, bool) => {
                if (err) {
                    this.emit('error', err)
                    return callback(err)
                }
                if (bool) {
                    this.push(chunk)
                }
                return callback()
            })
        }
    })
    filterStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return filterStream
}

/**
 * Warning: wrapped function needs to be single output per input
 * @param asyncFn
 * @returns {ParallelTransform}
 */
function asParallelTransform (fn) {
    const parallelTransformStream = new ParallelTransform(maxParallelTransforms, fn)
    parallelTransformStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return parallelTransformStream
}

/**
 * ASYNC METHODS BELOW
 */

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
        process.exit(-1)
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
        process.exit(-1)
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
        process.exit(-1)
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
        process.exit(-1)
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
        process.exit(-1)
    })
    return parallelTransformStream
}
