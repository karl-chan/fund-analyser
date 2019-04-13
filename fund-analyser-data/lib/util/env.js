module.exports = {
    isProduction
}

function isProduction () {
    return process.env.NODE_ENV === 'production'
}
