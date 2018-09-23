const Http = require('../util/http')
const cheerio = require('cheerio')
const moment = require('moment')
const url = require('url')
const Promise = require('bluebird')

const http = new Http()

class CharlesStanleyDirectAccount {
    constructor (jar) {
        if (!jar) {
            throw new Error('Missing jar')
        }
        this.jar = jar
        this.accountSummaryUrl = 'https://www.charles-stanley-direct.co.uk/accountSummaryApi/GetAccountSummary'
        this.myDirectAccountsUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts'
        this.portfolioValuationUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation'
        this.statementUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation/Statement'
    }

    async getBalance () {
        const res = await http.asyncGet(this.accountSummaryUrl, {jar: this.jar})
        const json = JSON.parse(res.body)
        // TODO: fix holdings
        return {
            portfolio: json.PortfolioValueTotal,
            cash: json.CashTotal,
            totalValue: json.PortfolioBalanceTotal,
            holdings: []
        }
    }

    async getStatement () {
        const {headers: h1} = http.asyncGet(this.statementUrl, {jar: this.jar, followRedirect: false})
        if (!h1.location || !h1.location.includes('AccountCode')) {
            throw new Error('Failed to get account number in statement query')
        }
        const accountCode = new url.URL(h1.location).searchParams.get('AccountCode')
        const qs = {
            AccountCode: accountCode,
            capital: true,
            income: true,
            searchType: 'period',
            DateFromDay: 1,
            DateFromMonth: 1,
            DateFromYear: 2000,
            DateToDay: moment().date(),
            DateToMonth: moment().month() + 1,
            DateToYear: moment().year(),
            pageSize: 10000000
        }
        const {body: b2} = http.asyncGet(`${this.statementUrl}/Search`, {jar: this.jar, qs})
        const $2 = cheerio.load(b2)
        const table = $2('#vac-stmt-table > tbody')
        return table
    }
}

module.exports = CharlesStanleyDirectAccount
