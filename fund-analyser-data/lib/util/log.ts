import * as properties from './properties'
import * as winston from 'winston'

const log = winston.createLogger({
  level: properties.get('log.level'),
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
})

export default log
