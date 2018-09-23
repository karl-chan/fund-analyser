const Http = require('../util/http')
const log = require('../util/log')
const cheerio = require('cheerio')
const rp = require('request-promise')

const http = new Http()

class CharlesStanleyDirectAuth {
    constructor () {
        this.accountUrl = 'https://www.charles-stanley-direct.co.uk/Account'
        this.checkMemorableWordUrl = 'https://www.charles-stanley-direct.co.uk/Account/CheckMemorableWord'
        this.accountLoginChecksUrl = 'https://www.charles-stanley-direct.co.uk/Account/AccountLoginChecks'
        this.myDirectAccountsUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts'
        this.myAccountsUrl = 'https://www.charles-stanley-direct.co.uk/Dashboard/MyAccounts'

        this.investmentSummaryUrl = 'https://www.charles-stanley-direct.co.uk/Dashboard/GetInvestmentSummaryJson?showByType='
    }

    async login (user, pass, memorableWord) {
        if (!user) throw new Error('Missing user')
        if (!pass) throw new Error('Missing password')
        if (!memorableWord) throw new Error('Missing memorable word')

        const jar = rp.jar()

        // Step 1: User name and password
        const {csrfToken} = await this._enterUserAndPass(user, pass, {jar})

        // Step 2: Memorable word
        await this._checkMemorableWord(memorableWord, {csrfToken, jar})

        // Step 3: Account login checks
        await this._accountLoginChecks({jar})

        // Step 4: Get user name
        const {name} = await this._getMyAccount({jar})

        // Step 4: Return cookies as jar
        return {jar, name}
    }

    // cost is about 200ms per call
    async isLoggedIn ({jar}) {
        if (!jar) throw new Error('Missing jar')
        const {statusCode} = await http.asyncGet(this.investmentSummaryUrl, {jar, followRedirect: false})
        return statusCode === 200
    }

    async _enterUserAndPass (user, pass, {jar}) {
        log.debug('Entering user and pass')
        const {body: b1} = await http.asyncGet(this.accountUrl, {jar})
        const $1 = cheerio.load(b1)
        const csrfToken1 = $1('input[name="__RequestVerificationToken"]').val()

        const {headers: h2} = await http.asyncPost(this.accountUrl,
            {
                jar,
                form: {
                    'LoginId': user,
                    'Password': pass,
                    '__RequestVerificationToken': csrfToken1
                }
            }
        )
        if (!this.checkMemorableWordUrl.includes(h2.location)) {
            throw new Error('Incorrect username or password')
        }

        const {body: b3} = await http.asyncGet(this.checkMemorableWordUrl, {jar})
        const $3 = cheerio.load(b3)
        const csrfToken3 = $3('input[name="__RequestVerificationToken"]').val()
        log.debug('User and pass accepted')
        return {csrfToken: csrfToken3}
    }

    async _checkMemorableWord (memorableWord, {csrfToken, jar}) {
        log.debug('Checking memorable word')
        const {body: b1} = await http.asyncGet(this.checkMemorableWordUrl, {jar})
        const $1 = cheerio.load(b1)
        const charIndex1 = parseInt($1('#memorable-word-form > div.field > div > strong:nth-child(1)').text())
        const charIndex2 = parseInt($1('#memorable-word-form > div.field > div > strong:nth-child(3)').text())
        const charIndex3 = parseInt($1('#memorable-word-form > div.field > div > strong:nth-child(5)').text())

        const {headers: h2} = await http.asyncPost(this.checkMemorableWordUrl,
            {
                jar,
                form: {
                    '__RequestVerificationToken': csrfToken,
                    'Character1': memorableWord.charAt(charIndex1 - 1),
                    'Character2': memorableWord.charAt(charIndex2 - 1),
                    'Character3': memorableWord.charAt(charIndex3 - 1)
                }
            }
        )
        if (!this.accountLoginChecksUrl.includes(h2.location)) {
            throw new Error('Incorrect memorable word')
        }
        log.debug('Memorable word accepted')
    }

    async _accountLoginChecks ({jar}) {
        log.debug('Performing account login check')
        const {headers} = await http.asyncGet(this.accountLoginChecksUrl, {jar, followRedirect: false})
        if (!this.myDirectAccountsUrl.includes(headers.location)) {
            throw new Error('Account login checks failed')
        }
        log.debug('Account login check completed')
    }

    async _getMyAccount ({jar}) {
        log.debug('Getting user name from my account')
        const {body} = await http.asyncGet(this.myAccountsUrl, {jar})
        const $ = cheerio.load(body)
        const accountName = $('body > table > tbody > tr > td:nth-child(1) > a').text()
        const name = accountName.match(/(.+)\(\d+\)/)[1].trim()
        return {name}
    }
}

module.exports = CharlesStanleyDirectAuth
