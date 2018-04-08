module.exports = CharlesStanleyDirectAccount

const http = require('../util/http.js')
const cheerio = require('cheerio')

function CharlesStanleyDirectAccount () {
    this.portfolioValuationUrl = 'https://www.charles-stanley-direct.co.uk/My_Dashboard/My_Direct_Accounts/Portfolio_Valuation'
}

CharlesStanleyDirectAccount.prototype.getBalance = async function (jar) {
    const {body} = await http.asyncGet(this.portfolioValuationUrl, {jar})
    const $ = cheerio.load(body)

    const portfolio = parseFloat($('#vacc-portfolio > tbody > tr > td > span').text().replace(/,/g, ''))
    const cash = parseFloat($('#vacc-cash > tbody > tr > td > span').text().replace(/,/g, ''))
    const totalValue = parseFloat($('#vacc-total > tbody > tr > td > span').text().replace(/,/g, ''))
    const holdings = JSON.parse(body.match(/CS\.portStreamingData = (.*);/)[1])
    return {portfolio, cash, totalValue, holdings}
}
