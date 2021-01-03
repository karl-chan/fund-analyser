import { isNil } from 'lodash'
import * as path from 'path'
import PropertiesReader from 'properties-reader'
import { getProjectRoot } from './paths'

const propertiesPath = path.resolve(getProjectRoot(), 'app.properties')
const properties = PropertiesReader(propertiesPath)

// magic string reminder to override property via environmental variables
const OVERRIDE_ME = 'override_me'

export function get (path: any) {
  return tryParse(
    path,
    getFromEnvironment(path) || getFromFile(path))
}

function getFromEnvironment (path: any) {
  return process.env[path] || process.env[path.replace(/\./g, '_')]
}

function getFromFile (path: any) {
  return properties.get(path)
}

function tryParse (path: any, value: any) {
  try {
    value = JSON.parse(value)
  } catch (ignored) { }

  if (value === OVERRIDE_ME) {
    throw new Error(`Please override property [${path}] in system env variables!`)
  }

  return isNil(value) ? undefined : value
}
