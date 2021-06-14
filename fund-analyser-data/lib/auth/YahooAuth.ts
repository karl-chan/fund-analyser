import cheerio from 'cheerio'
import { CookieJar } from 'tough-cookie'
import Http from '../util/http'
import log from '../util/log'

const http = new Http()

export default class YahooAuth {
    loginUrl: string
    passwordChallengeUrl: string
    personalInfoUrl: string
    constructor () {
      this.loginUrl = 'https://login.yahoo.com/'
      this.passwordChallengeUrl = 'https://login.yahoo.com/account/challenge/password'
      this.personalInfoUrl = 'https://login.yahoo.com/account/personalinfo'
    }

    async login (user: string, pass: string) {
      if (!user) throw new Error('Missing user')
      if (!pass) throw new Error('Missing password')

      const jar = new CookieJar()

      await this._enterUserAndPass(user, pass, { jar })

      return { jar }
    }

    async _enterUserAndPass (user: string, pass: string, { jar }: {jar: CookieJar}) {
      const { data: res1 } = await http.asyncGet(this.loginUrl, {
        jar,
        withCredentials: true
      })
      const $1 = cheerio.load(res1)
      const browserFpData1 = $1('#browser-fp-data').attr('value')
      const sessionIndex1 = $1('#login-username-form input[name=sessionIndex]').attr('value')
      const acrumb1 = $1('#login-username-form input[name=acrumb]').attr('value')

      const params1 = new URLSearchParams()
      params1.append('browser-fp-data', browserFpData1)
      params1.append('crumb', '')
      params1.append('acrumb', acrumb1)
      params1.append('sessionIndex', sessionIndex1)
      params1.append('displayName', '')
      params1.append('deviceCapability', '{"pa":{"status":true}}')
      params1.append('username', user)
      params1.append('passwd', '')
      params1.append('signin', 'Next')

      await http.asyncPost(this.loginUrl, {
        jar,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params1.toString()
      })

      const { data: res2 } = await http.asyncGet(this.passwordChallengeUrl, {
        jar,
        withCredentials: true,
        headers: {
          referer: 'https://login.yahoo.com/'
        },
        params: {
          done: 'https://www.yahoo.com/',
          sessionIndex: sessionIndex1,
          acrumb: acrumb1,
          display: 'login',
          authMechanism: 'primary'
        }
      })
      const $2 = cheerio.load(res2)
      const browserFpData2 = $2('#browser-fp-data').attr('value')
      const sessionIndex2 = $2('#password-challenge input[name=sessionIndex]').attr('value')
      const crumb2 = $2('#password-challenge input[name=crumb]').attr('value')
      const acrumb2 = $2('#password-challenge input[name=acrumb]').attr('value')

      const params2 = new URLSearchParams()
      params1.append('browser-fp-data', browserFpData2)
      params2.append('sessionIndex', sessionIndex2)
      params2.append('crumb', crumb2)
      params2.append('acrumb', acrumb2)
      params2.append('displayName', user)
      params2.append('username', user)
      params2.append('passwordContext', 'normal')
      params2.append('password', pass)
      params2.append('isShowButtonClicked', '')
      params2.append('showButtonStatus', '')
      params2.append('prefersReducedMotion', '')
      params2.append('verifyPassword', 'Next')
      params2.append('signin', 'Next')

      const { data: res3 } = await http.asyncPost(this.passwordChallengeUrl, {
        jar,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
          done: 'https://www.yahoo.com/',
          sessionIndex: sessionIndex2,
          acrumb: acrumb2,
          display: 'login',
          authMechanism: 'primary'
        },
        data: params2.toString()
      })
      if (res3.includes('We can’t sign you in right now.')) {
        throw new Error('Incorrect username or password')
      }
      log.debug('User and pass accepted')
      return { jar }
    }

    async isLoggedIn ({ jar }: {jar: CookieJar}) {
      if (!jar) throw new Error('Missing jar')
      const { status } = await http.asyncGet(this.personalInfoUrl, {
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: null
      })
      return status === 200
    }
}
