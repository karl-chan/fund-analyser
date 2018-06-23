const properties = require('./properties.js')
const winston = require('winston')

const log = winston.createLogger({
    level: properties.get('log.level'),
    format: winston.format.simple(),
    transports: [ new winston.transports.Console() ]
})

module.exports = log
