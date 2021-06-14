import { Promise } from 'bluebird'
import cheerio from 'cheerio'
import FormData from 'form-data'
import { JSDOM } from 'jsdom'
import moment from 'moment'
import readline from 'readline'
import { CookieJar } from 'tough-cookie'
import YahooMailAccount from '../account/YahooMailAccount'
import Http from '../util/http'
import log from '../util/log'

const http = new Http()

export default class CharlesSchwabAuth {
    customerCenterLoginUrl: string;
    loginUrl: string;
    optionSelectionUrl: string
    accessCodeEntryUrl: string
    redirectAfterLoginUrl: string
    urgentNotificationUrl: string

    constructor (private yahooMailAccount: YahooMailAccount) {
      this.customerCenterLoginUrl = 'https://client.schwab.com/Login/SignOn/CustomerCenterLogin.aspx'
      this.loginUrl = 'https://lms.schwab.com/Login'
      this.optionSelectionUrl = 'https://lms.schwab.com/Sua/DeviceTag/OptionSelection'
      this.accessCodeEntryUrl = 'https://lms.schwab.com/Sua/DeviceTag/AccessCodeEntry'
      this.redirectAfterLoginUrl = 'https://lms.schwab.com/Redirect'
      this.urgentNotificationUrl = 'https://client.schwab.com/api/summary/urgentNotification'
    }

    async isLoggedIn ({ jar }: {jar: CookieJar}) {
      if (!jar) throw new Error('Missing jar')
      const { status } = await http.asyncGet(this.urgentNotificationUrl, {
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: null
      })
      return status === 200
    }

    async login (user: string, pass: string) {
      if (!user) throw new Error('Missing user')
      if (!pass) throw new Error('Missing password')

      const jar = new CookieJar()

      // Step 1: User name and password
      const interveneUrl = await this._enterUserAndPass(user, pass, { jar })

      // Step 2: Select 2fa method
      const { sessionId } = await this._requestTwoFactorAuthCode(interveneUrl, { jar })

      // Step 3: Retrieve 2fa code
      // const code = await this._pollTwoFactorCode()
      const code = await this._fakeTwoFactorCode()

      // Step 4: Submit 2fa code
      await this._submitTwoFactorAuthCode(code, { jar, sessionId })

      // Step 5: Return cookies as jar
      return { jar }
    }

    async _enterUserAndPass (user: string, pass: string, { jar }: { jar: CookieJar }) {
      log.debug('Entering user and pass')

      // Need these calls to obtain site cookies before login
      const { data: res1 } = await http.asyncGet(this.customerCenterLoginUrl, {
        jar,
        withCredentials: true
      })
      const $1 = cheerio.load(res1)
      const loginPageUrl = $1('#lmsSecondaryLogin').attr('src')

      const { data: res2 } = await http.asyncGet(loginPageUrl, {
        jar,
        withCredentials: true
      })
      const $2 = cheerio.load(res2)
      const startInSetId = $2('#StartInSetId').attr('value')

      const script = $2('script').filter((i, el) => $2(el).html().includes('schwabform')).html()
      const dom = new JSDOM(`<script>${script}</script>`, { runScripts: 'dangerously' })
      const hdnRbaDfp = dom.window.schwab.schwabform()

      const form = new FormData()
      form.append('ClientId', 'schwab-secondary')
      form.append('State', '')
      form.append('Region', '')
      form.append('RedirectUri', 'https://client.schwab.com/Login/Signon/AuthCodeHandler.ashx')
      form.append('hdnRbaDfp', JSON.stringify({
        vendor: '41st',
        data: hdnRbaDfp
      }))
      form.append('StartInSetId', startInSetId)
      form.append('EnableAccessRecoveryCMSAsset', 'True')
      form.append('EnableDefaultStartPageselection', 'True')
      form.append('LoginId', user)
      form.append('Password', pass)
      form.append('StartIn', 'CCBodyi')
      form.append('&lid=Log in', '')

      const { data: res3 } = await http.asyncPost(this.loginUrl,
        {
          jar,
          withCredentials: true,
          headers: {
            origin: 'https://lms.schwab.com',
            referer: loginPageUrl
          },
          data: form
        }
      )
      const interveneUrl = res3.RedirectUrl
      if (!interveneUrl?.startsWith('https://lms.schwab.com/Intervene')) {
        throw new Error('Incorrect username or password')
      }
      log.debug('User and pass accepted')
      return interveneUrl
    }

    async _requestTwoFactorAuthCode (interveneUrl: string, { jar }: { jar: CookieJar }) {
      const { data: res1 } = await http.asyncGet(interveneUrl, {
        jar,
        withCredentials: true
      })
      const $ = cheerio.load(res1)
      const sessionId = $('#SessionId').attr('value')

      const form = new FormData()
      form.append('ClientId', 'schwab-secondary')
      form.append('SessionId', sessionId)
      form.append('SuaType', 'DeviceTag')
      form.append('Region', '')
      form.append('RedirectUrl', 'https,//client.schwab.com/Login/Signon/AuthCodeHandler.ashx')
      form.append('State', '')
      form.append('OptionSelectRedirectAction', 'OptionSelection')
      form.append('DeliveryMethodSelection', 'Email')
      form.append('SelectedEmailAddress', '1')

      const { headers: h2 } = await http.asyncPost(this.optionSelectionUrl, {
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: null,
        data: form
      })
      if (!h2.location || !h2.location.includes('/Sua/DeviceTag/AccessCodeEntry')) {
        throw new Error('Failed to request 2fa code')
      }

      const accessCodeEntryUrl = `https://lms.schwab.com${h2.location}`
      await http.asyncGet(accessCodeEntryUrl, {
        jar,
        withCredentials: true
      })
      return { sessionId }
    }

    async _submitTwoFactorAuthCode (code: string, { jar, sessionId }: {jar: CookieJar, sessionId: string}) {
      const form = new FormData()
      form.append('ClientId', 'schwab-secondary')
      form.append('SessionId', sessionId)
      form.append('SuaType', 'DeviceTag')
      form.append('State', '')
      form.append('RedirectUrl', 'https://client.schwab.com/Login/Signon/AuthCodeHandler.ashx')
      form.append('DeliveryMethodSelection', 'Email')
      form.append('Region', '')
      form.append('CancelReturnToLmsAction', '')
      form.append('OptionSelectRedirectAction', 'AccessCodeEntry')
      form.append('IsMobileApplication', 'False')
      form.append('IsRepOnly', 'False')
      form.append('PinNumber', code)
      form.append('TrustDeviceChecked', 'false')

      const { headers: h2 } = await http.asyncPost(this.accessCodeEntryUrl,
        {
          jar,
          withCredentials: true,
          maxRedirects: 0,
          validateStatus: null,
          data: form
        }
      )
      if (!h2.location || !h2.location.includes('/Sua/DeviceTag/Success')) {
        throw new Error(`Invalid 2fa access code: ${code}`)
      }

      // Login is successful here, but still need to complete the below checks.

      const successUrl = `https://lms.schwab.com${h2.location}`
      const { data: res3 } = await http.asyncGet(successUrl, {
        jar,
        withCredentials: true
      })
      const $3 = cheerio.load(res3)
      const redirectUri = $3('#RedirectUri').attr('value')

      const form3 = new FormData()
      form3.append('RedirectUri', redirectUri)

      const { headers: h3 } = await http.asyncPost(this.redirectAfterLoginUrl, {
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: null,
        data: form3
      })
      if (!h3.location || !h3.location.includes('/Login/ResultDeviceTag')) {
        throw new Error('Failed to obtain /Login/ResultDeviceTag url')
      }

      const resultDeviceTagUrl = `https://lms.schwab.com${h3.location}`
      const { headers: h4 } = await http.asyncGet(resultDeviceTagUrl, {
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: null
      })
      if (!h4.location || !h4.location.includes('/Login/Signon/AuthCodeHandler')) {
        throw new Error('Failed to obtain /Login/Signon/AuthCodeHandler url')
      }

      const authCodeHandlerUrl = h4.location
      const { headers: h5 } = await http.asyncGet(authCodeHandlerUrl, {
        jar,
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: null
      })
      if (h5.location !== '/clientapps/accounts/summary/') {
        throw new Error('Failed to obtain accounts summary url')
      }

      const accountSummaryUrl = `https://client.schwab.com${h5.location}`
      await http.asyncGet(accountSummaryUrl, {
        jar,
        withCredentials: true
      })
    }

    async _fakeTwoFactorCode () {
      const rl = readline.createInterface({
        input: process.stdin, // or fileStream
        output: process.stdout
      })
      const code : string = await new Promise((resolve) => {
        rl.question('Enter code: ', resolve)
      })
      return code
    }

    async _pollTwoFactorCode () {
      const requestTime = moment()
      const messages = await this.yahooMailAccount.listRecentMessages()

      let maxPolls = 10
      while (maxPolls) {
        await Promise.delay(10000) // wait 10 seconds and scan for new message in case delay
        const message = messages.find(message => {
          return message.from === 'Charles Schwab.' &&
          message.subject === 'Your requested Schwab access code.' &&
          message.date.isSameOrAfter(requestTime)
        })
        if (message) {
          const code = message.summary.match(/Access code: (\d+)/)[1]
          return code
        }
        maxPolls--
        log.debug(`Haven't received 2fa code yet. Num polls left: ${maxPolls}`)
      }
      throw new Error('Never received 2fa code!')
    }
}
