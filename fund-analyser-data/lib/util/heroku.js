
const properties = require('./properties.js')
const Heroku = require('heroku-client')

const appName = properties.get('heroku.app.name')

function newClient () {
    const token = properties.get('heroku.api.token')
    return new Heroku({ token })
}

module.exports = {
    appName,
    newClient
}
