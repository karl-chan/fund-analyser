module.exports = CharlesStanleyDirectAccount

const http = require('../util/http.js')
const cheerio = require('cheerio')

function CharlesStanleyDirectAccount () {
    this.myDirectAccountsUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts'
    this.portfolioValuationUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation'
}

CharlesStanleyDirectAccount.prototype.getBalance = async function (jar) {
    const [r1, r2] = await Promise.all([
        http.asyncGet(this.myDirectAccountsUrl, {jar}),
        http.asyncGet(this.portfolioValuationUrl, {jar})
    ])

    const $1 = cheerio.load(r1.body)
    const row = $1('#myac-table > tbody > tr:last-child')
    const portfolio = parseFloat(row.find('td.portfolio').text().replace(/[£,]/g, ''))
    const cash = parseFloat(row.find('td.balance').text().replace(/[£,]/g, ''))
    const totalValue = parseFloat(row.find('td.total').text().replace(/[£,]/g, ''))

    const holdings = JSON.parse(r2.body.match(/CS\.portStreamingData = (.*);/)[1])
    return {portfolio, cash, totalValue, holdings}
}
