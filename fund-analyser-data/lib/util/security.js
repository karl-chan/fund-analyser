module.exports = {
    encryptString,
    decryptString,
    parseUserAgent
}

const properties = require('./properties')
const CryptoJS = require('crypto-js')
const userAgentParser = require('ua-parser-js')

const secretKey = properties.get('secret.key')

function encryptString (s) {
    return CryptoJS.AES.encrypt(s, secretKey).toString()
}

function decryptString (s) {
    return CryptoJS.AES.decrypt(s, secretKey).toString(CryptoJS.enc.Utf8)
}

function parseUserAgent (s) {
    const {ua, browser, device, os} = userAgentParser(s)
    return {ua, browser, device, os}
}
