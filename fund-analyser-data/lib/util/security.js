module.exports = {
    encryptString,
    decryptString
}

const properties = require('./properties.js')
const CryptoJS = require('crypto-js')

const secretKey = properties.get('secret.key')

function encryptString (s) {
    return CryptoJS.AES.encrypt(s, secretKey).toString()
}

function decryptString (s) {
    return CryptoJS.AES.decrypt(s, secretKey).toString(CryptoJS.enc.Utf8)
}
