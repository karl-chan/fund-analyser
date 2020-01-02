module.exports = {
    simulate,
    predict,
    getStrategies,
    pushNotificationsForUser
}

const compute = require('../../client/compute')
const { push } = require('../util/push')

const Promise = require('bluebird')

async function simulate (simulateParam) {
    return compute.post('/simulate', simulateParam)
}

async function predict (simulateParam, date) {
    return compute.post('/simulate/predict', { simulateParam, date })
}

async function getStrategies () {
    return compute.get('/simulate/strategies')
}

async function pushNotificationsForUser (simulateParams, user) {
    const predictionPairs = await Promise.map(simulateParams, async simulateParam => {
        const prediction = await predict(simulateParam)
        return {
            simulateParam,
            prediction
        }
    })
    return push(user, 'trade', predictionPairs)
}
