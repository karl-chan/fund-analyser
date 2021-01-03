import Http from '../util/http'
import log from '../util/log'
import * as cheerio from 'cheerio'
import rp from 'request-promise'

const http = new Http()

export default class CharlesStanleyDirectAuth {
    getAccountSummaryUrl: any;
    getChangeInValuePerAccountUrl: any;
    getMemorableWordUrl: any;
    homeUrl: any;
    logUserInUrl: any;
    loginUrl: any;
    validateMemorableWordUrl: any;
    constructor () {
      this.homeUrl = 'https://www.charles-stanley-direct.co.uk/'
      this.loginUrl = 'https://www.charles-stanley-direct.co.uk/Login/Login'
      this.getMemorableWordUrl = 'https://www.charles-stanley-direct.co.uk/Login/GetMemorableWord'
      this.validateMemorableWordUrl = 'https://www.charles-stanley-direct.co.uk/Login/ValidateMemorableWord'
      this.logUserInUrl = 'https://www.charles-stanley-direct.co.uk/Login/LogUserIn'
      this.getAccountSummaryUrl = 'https://www.charles-stanley-direct.co.uk/accountSummary/GetAccountSummary'

      this.getChangeInValuePerAccountUrl = 'https://www.charles-stanley-direct.co.uk/AccountSummary/GetChangeInValuePerAccount'
    }

    async login (user: any, pass: any, memorableWord: any) {
      if (!user) throw new Error('Missing user')
      if (!pass) throw new Error('Missing password')
      if (!memorableWord) throw new Error('Missing memorable word')

      const jar = rp.jar()

      // Step 1: User name and password
      const { csrfToken } = await this._enterUserAndPass(user, pass, { jar })

      // Step 2: Memorable word
      await this._checkMemorableWord(memorableWord, { csrfToken, jar })

      // Step 3: Log user in
      await this._logUserIn({ csrfToken, jar })

      // Step 4: Get user name
      const { name } = await this._getMyAccount({ jar })

      // Step 4: Return cookies as jar
      return { jar, name }
    }

    // cost is about 70ms per call
    async isLoggedIn ({
      jar
    }: any) {
      if (!jar) throw new Error('Missing jar')
      const { statusCode } = await http.asyncGet(this.getChangeInValuePerAccountUrl, { jar, followRedirect: false })
      return statusCode === 200
    }

    async _enterUserAndPass (user: any, pass: any, {
      jar
    }: any) {
      log.debug('Entering user and pass')
      const { body: b1 } = await http.asyncGet(this.homeUrl, { jar })
      const $1 = cheerio.load(b1)
      const csrfToken = $1('#__AjaxAntiForgeryForm > input[name="__RequestVerificationToken"]').val()

      try {
        await http.asyncPost(this.loginUrl,
          {
            jar,
            form: {
              Username: user,
              Password: pass,
              __RequestVerificationToken: csrfToken
            }
          }
        )
      } catch (err) {
        throw new Error('Incorrect username or password')
      }
      log.debug('User and pass accepted')
      return { csrfToken }
    }

    async _checkMemorableWord (memorableWord: any, {
      csrfToken,
      jar
    }: any) {
      log.debug('Checking memorable word')

      const { body: b1 } = await http.asyncPost(this.getMemorableWordUrl, {
        jar,
        headers: {
          RequestVerificationToken: csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      const { FirstCharacterPosition, SecondCharacterPosition, ThirdCharacterPosition } = JSON.parse(b1)
      try {
        await http.asyncPost(this.validateMemorableWordUrl,
          {
            jar,
            headers: {
              RequestVerificationToken: csrfToken,
              'X-Requested-With': 'XMLHttpRequest'
            },
            form: {
              firstCharacter: memorableWord.charAt(FirstCharacterPosition - 1),
              secondCharacter: memorableWord.charAt(SecondCharacterPosition - 1),
              thirdCharacter: memorableWord.charAt(ThirdCharacterPosition - 1)
            }
          }
        )
      } catch (err) {
        throw new Error('Incorrect memorable word')
      }
      log.debug('Memorable word accepted')
    }

    async _logUserIn ({
      csrfToken,
      jar
    }: any) {
      log.debug('Logging user in')
      try {
        await http.asyncPost(this.logUserInUrl, {
          jar,
          headers: {
            RequestVerificationToken: csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
      } catch (err) {
        throw new Error('Log user in failed')
      }
      log.debug('Log user in completed')
    }

    async _getMyAccount ({
      jar
    }: any) {
      log.debug('Getting user name from my account')
      const { body } = await http.asyncGet(this.getAccountSummaryUrl, { jar })
      const account = JSON.parse(body)
      const name = account.Accounts[0].AccountName
      return { name }
    }
}
