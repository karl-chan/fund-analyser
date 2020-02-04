const Http = require('../util/http')
const log = require('../util/log')
const cheerio = require('cheerio')
const rp = require('request-promise')

const http = new Http()

class CharlesStanleyDirectAuth {
    constructor () {
        this.homeUrl = 'https://www.charles-stanley-direct.co.uk/'
        this.loginUrl = 'https://www.charles-stanley-direct.co.uk/LoginApi/Login'
        this.getMemorableWordUrl = 'https://www.charles-stanley-direct.co.uk/LoginApi/GetMemorableWord'
        this.validateMemorableWordUrl = 'https://www.charles-stanley-direct.co.uk/LoginApi/ValidateMemorableWord'
        this.logUserInUrl = 'https://www.charles-stanley-direct.co.uk/LoginApi/LogUserIn'
        this.myAccountsUrl = 'https://www.charles-stanley-direct.co.uk/Dashboard/MyAccounts'

        this.investmentSummaryUrl = 'https://www.charles-stanley-direct.co.uk/Dashboard/GetInvestmentSummaryJson?showByType='
    }

    async login (user, pass, memorableWord) {
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

    // cost is about 200ms per call
    async isLoggedIn ({ jar }) {
        if (!jar) throw new Error('Missing jar')
        const { statusCode } = await http.asyncGet(this.investmentSummaryUrl, { jar, followRedirect: false })
        return statusCode === 200
    }

    async _enterUserAndPass (user, pass, { jar }) {
        log.debug('Entering user and pass')
        const { body: b1 } = await http.asyncGet(this.homeUrl, { jar })
        const $1 = cheerio.load(b1)
        const csrfToken = $1('#__AjaxAntiForgeryForm > input[name="__RequestVerificationToken"]').val()

        try {
            await http.asyncPost(this.loginUrl,
                {
                    jar,
                    form: {
                        'Username': user,
                        'Password': pass,
                        '__RequestVerificationToken': csrfToken
                    }
                }
            )
        } catch (err) {
            throw new Error('Incorrect username or password')
        }
        log.debug('User and pass accepted')
        return { csrfToken }
    }

    async _checkMemorableWord (memorableWord, { csrfToken, jar }) {
        log.debug('Checking memorable word')

        const { body: b1 } = await http.asyncPost(this.getMemorableWordUrl, {
            jar,
            headers: {
                'RequestVerificationToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        const { FirstCharacterPosition, SecondCharacterPosition, ThirdCharacterPosition } = JSON.parse(b1)
        try {
            await http.asyncPost(this.validateMemorableWordUrl,
                {
                    jar,
                    headers: {
                        'RequestVerificationToken': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    form: {
                        'firstCharacter': memorableWord.charAt(FirstCharacterPosition - 1),
                        'secondCharacter': memorableWord.charAt(SecondCharacterPosition - 1),
                        'thirdCharacter': memorableWord.charAt(ThirdCharacterPosition - 1)
                    }
                }
            )
        } catch (err) {
            throw new Error('Incorrect memorable word')
        }
        log.debug('Memorable word accepted')
    }

    async _logUserIn ({ csrfToken, jar }) {
        log.debug('Logging user in')
        try {
            await http.asyncPost(this.logUserInUrl, {
                jar,
                headers: {
                    'RequestVerificationToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
        } catch (err) {
            throw new Error('Log user in failed')
        }
        log.debug('Log user in completed')
    }

    async _getMyAccount ({ jar }) {
        log.debug('Getting user name from my account')
        const { body } = await http.asyncGet(this.myAccountsUrl, { jar })
        const $ = cheerio.load(body)
        const accountName = $('body > table > tbody > tr > td:nth-child(1) > a').text()
        const name = accountName.match(/(.+)\(\d+\)/)[1].trim()
        return { name }
    }
}

module.exports = CharlesStanleyDirectAuth
