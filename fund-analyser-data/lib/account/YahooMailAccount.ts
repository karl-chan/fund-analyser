import cheerio from 'cheerio'
import moment from 'moment'
import { CookieJar } from 'tough-cookie'
import Http from '../util/http'

const http = new Http()

export interface YahooMailMessage {
  from: string
  date: moment.Moment
  subject: string
  summary: string
}

export default class YahooMailAccount {
    jar: CookieJar
    constructor (jar: CookieJar) {
      if (!jar) {
        throw new Error('Missing jar')
      }
      this.jar = jar
    }

    async listRecentMessages () : Promise<YahooMailMessage[]> {
      const { data } = await http.asyncGet('https://mail.yahoo.com/d/folders/1/', {
        jar: this.jar,
        withCredentials: true
      })
      const $ = cheerio.load(data)
      return $('a[role="article"]')
        .map((i, a) => $(a).attr('aria-label').trim())
        .get()
        .map(text => {
          const [, from, date, subject, summary] = text.match(/From: (.+)\n +(.+)\n(?:[\s\S]*?)Subject: (.+)\n +Summary: (.+)/)
          return {
            from,
            date: moment.utc(date, 'MMM D, YYYY, UTC h:mm A.'),
            subject,
            summary
          }
        })
    }
}
