module.exports = {
    simulate,
    predict,
    getStrategies,
    pushNotificationsForUser
}

const UserDAO = require('../db/UserDAO')
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

async function pushNotificationsForUser (user) {
    const simulateParams = await UserDAO.getSimulateParams(user)
    // Only push for active simulate params
    const activeSimulateParams = simulateParams.filter(simulateParam => simulateParam.active)
    const predictionPairs = await Promise.map(activeSimulateParams, async simulateParam => {
        const prediction = await predict(simulateParam)
        return {
            simulateParam,
            prediction
        }
    })
    return push(user, 'trade', predictionPairs)
}
