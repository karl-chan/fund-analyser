const properties = require('./properties')
const winston = require('winston')

const log = winston.createLogger({
    level: properties.get('log.level'),
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.simple()
    ),
    transports: [ new winston.transports.Console() ]
})

module.exports = log
