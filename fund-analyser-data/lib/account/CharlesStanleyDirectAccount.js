module.exports = CharlesStanleyDirectAccount

const Http = require('../util/http')
const cheerio = require('cheerio')
const moment = require('moment')
const url = require('url')
const Promise = require('bluebird')

const http = new Http()

function CharlesStanleyDirectAccount () {
    this.myDirectAccountsUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts'
    this.portfolioValuationUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation'
    this.statementUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation/Statement'
}

CharlesStanleyDirectAccount.prototype.getBalance = async function (jar) {
    const [r1, r2] = await Promise.all([
        http.asyncGet(this.myDirectAccountsUrl, {jar}),
        http.asyncGet(this.portfolioValuationUrl, {jar})
    ])

    const $1 = cheerio.load(r1.body)
    const row = $1('#myac-table > tbody > tr:last-child')
    const portfolio = parseFloat(row.find('td.portfolio').text().replace(/[£,]/g, '')) || 0
    const cash = parseFloat(row.find('td.balance').text().replace(/[£,]/g, '')) || 0
    const totalValue = parseFloat(row.find('td.total').text().replace(/[£,]/g, '')) || 0

    const matches = r2.body.match(/CS\.portStreamingData = (.*);/)
    const holdings = matches ? JSON.parse(matches[1]) : []
    return {portfolio, cash, totalValue, holdings}
}

CharlesStanleyDirectAccount.prototype.getStatement = async function (jar) {
    const {headers: h1} = http.asyncGet(this.statementUrl, {jar, followRedirect: false})
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
    const {body: b2} = http.asyncGet(`${this.statementUrl}/Search`, {jar, qs})
    const $2 = cheerio.load(b2)
    const table = $2('#vac-stmt-table > tbody')
    return table
}
