const properties = require('./properties.js')
const winston = require('winston')

const log = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            'timestamp': true,
            'level': properties.get('log.level')
        })
    ]
})

module.exports = log
