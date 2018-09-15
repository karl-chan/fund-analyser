module.exports = {
    asReadable,
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
const semaphore = require('semaphore')

function asReadable (fn) {
    const mutex = newMutex()
    const readableStream = new stream.Readable({
        objectMode: true,
        read (size) {
            mutex.take(() => {
                if (this.done) {
                    return
                }
                fn((err, data) => {
                    if (err) {
                        this.emit('error', err)
                        mutex.leave()
                        return
                    }
                    if (_.isArray(data)) {
                        _.forEach(data, (chunk) => {
                            this.push(chunk)
                        })
                    } else {
                        this.push(data)
                    }
                    this.push(null)
                    this.done = true
                    mutex.leave()
                })
            })
        }
    })
    readableStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return readableStream
}

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
 * @param fn
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

function asReadableAsync (promise) {
    const mutex = newMutex()
    const readableStream = new stream.Readable({
        objectMode: true,
        read (size) {
            mutex.take(async () => {
                if (this.done) {
                    return
                }
                try {
                    const data = await promise()
                    if (_.isArray(data)) {
                        _.forEach(data, (chunk) => {
                            this.push(chunk)
                        })
                    } else {
                        this.push(data)
                    }
                    this.push(null)
                    this.done = true
                    mutex.leave()
                } catch (err) {
                    this.emit('error', err)
                    mutex.leave()
                }
            })
        }
    })
    readableStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return readableStream
}

function asWritableAsync (promise) {
    const writableStream = new stream.Writable({
        objectMode: true,
        async  write (chunk, encoding, callback) {
            try {
                await promise(chunk)
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

function asTransformAsync (promise) {
    const transformStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        async transform (chunk, encoding, callback) {
            try {
                const data = await promise(chunk)
                if (_.isArray(data)) {
                    _.forEach(data, (chunk) => {
                        this.push(chunk)
                    })
                } else {
                    this.push(data)
                }
                callback()
            } catch (err) {
                this.emit('error', err)
                callback(err)
            }
        }
    })
    transformStream.on('error', function (err) {
        log.error(err)
        process.exit(-1)
    })
    return transformStream
}

function asFilterAsync (promise) {
    const filterStream = new stream.Transform({
        allowHalfOpen: false,
        objectMode: true,
        async transform (chunk, encoding, callback) {
            try {
                const bool = await promise(chunk)
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
 * @param fn
 * @returns {ParallelTransform}
 */
function asParallelTransformAsync (promise) {
    const parallelTransformStream = new ParallelTransform(maxParallelTransforms, async (chunk, callback) => {
        try {
            const data = await promise(chunk)
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

function newMutex () {
    return semaphore(1)
}
