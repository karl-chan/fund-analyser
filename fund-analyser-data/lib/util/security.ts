import * as properties from './properties'
import CryptoJS from 'crypto-js'
import UserAgentParser from 'ua-parser-js'

const secretKey = properties.get('secret.key')

export function encryptString (s: any) {
  return CryptoJS.AES.encrypt(s, secretKey).toString()
}

export function decryptString (s: any) {
  return CryptoJS.AES.decrypt(s, secretKey).toString(CryptoJS.enc.Utf8)
}

export function parseUserAgent (s: any) {
  const parser = new UserAgentParser(s)
  return {
    ua: parser.getUA(),
    browser: parser.getBrowser(),
    device: parser.getDevice(),
    os: parser.getOS()
  }
}
