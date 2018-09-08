module.exports = {
    asReadable,
    asWritable,
    asTransform,
    asFilter,
    asParallelTransform
}

const properties = require('./properties.js')
const maxParallelTransforms = properties.get('stream.max.parallel.transforms')

const log = require('./log.js')
const stream = require('stream')
const ParallelTransform = require('parallel-transform')
const _ = require('lodash')
const mutex = require('semaphore')(1)

function asReadable (fn) {
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
