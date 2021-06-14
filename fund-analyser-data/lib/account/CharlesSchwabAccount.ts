import { CookieJar } from 'tough-cookie'
import Http from '../util/http'

const http = new Http()

export interface Balance {
  totalValue: number
  cash : number
}

export default class CharlesSchwabAccount {
    jar: CookieJar
    accountSummaryUrl: string
    constructor (jar?: CookieJar) {
      if (!jar) {
        throw new Error('Missing cookieJar')
      }
      this.jar = jar
      this.accountSummaryUrl = 'https://client.schwab.com/api/summary/account'
    }

    async getBalance (): Promise<Balance> {
      const { data } = await http.asyncGet(this.accountSummaryUrl, {
        jar: this.jar,
        withCredentials: true,
        responseType: 'json'
      })
      const { Groups } = data
      return {
        totalValue: Groups[0].TotalBalance,
        cash: Groups[0].TotalCash
      }
    }
}
