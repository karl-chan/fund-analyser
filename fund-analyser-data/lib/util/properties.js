
module.exports = {
    get
}

const path = require('path')
const _ = require('lodash')
const propertiesPath = path.join(__dirname, '../..', 'app.properties')

const PropertiesReader = require('properties-reader')
const properties = PropertiesReader(propertiesPath)

// magic string reminder to override property via environmental variables
const OVERRIDE_ME = 'override_me'

function get (path) {
    return tryParse(
        path,
        path in process.env
            ? getFromEnvironment(path)
            : getFromFile(path))
}

function getFromEnvironment (path) {
    return process.env[path]
}

function getFromFile (path) {
    return properties.get(path)
}

function tryParse (path, value) {
    try {
        value = JSON.parse(value)
    } catch (ignored) { }

    if (value === OVERRIDE_ME) {
        throw new Error(`Please override property [${path}] in system env variables!`)
    }

    return _.isNil(value) ? undefined : value
}
