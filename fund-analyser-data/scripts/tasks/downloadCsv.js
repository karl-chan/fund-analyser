module.exports = downloadCsv

const properties = require('../../lib/util/properties')
const log = require('../../lib/util/log')
const FundDAO = require('../../lib/db/FundDAO')
const moment = require('moment')
const fs = require('fs')

async function downloadCsv () {
    let savePath = properties.get('csv.save.path')
    savePath = savePath.replace('.csv', '_' + moment.utc().format('YYYYMMDD') + '.csv')
    const options = {
        query: {
            name: { $ne: null }
        },
        projection: {
            'isin': 1,
            'name': 1,
            'type': 1,
            'shareClass': 1,
            'frequency': 1,
            'ocf': 1,
            'amc': 1,
            'entryCharge': 1,
            'exitCharge': 1,
            'bidAskSpread': 1,
            'returns.5Y': 1,
            'returns.3Y': 1,
            'returns.1Y': 1,
            'returns.6M': 1,
            'returns.3M': 1,
            'returns.1M': 1,
            'returns.2W': 1,
            'returns.1W': 1,
            'returns.3D': 1,
            'returns.1D': 1,
            'indicators.stability': 1,
            'holdings': 1,
            'asof': 1
        },
        sort: {
            'returns.1D': -1
        }
    }

    const headerFields = ['isin', 'name', 'type', 'shareClass', 'frequency',
        'ocf', 'amc', 'entryCharge', 'exitCharge', 'bidAskSpread', 'returns.5Y', 'returns.3Y',
        'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'returns.2W',
        'returns.1W', 'returns.3D', 'returns.1D', 'indicators.stability', 'holdings', 'asof']
    const csvFile = await FundDAO.exportCsv(headerFields, options)
    fs.writeFileSync(savePath, csvFile)
    log.info('Saved csv file to %s', savePath)
}
