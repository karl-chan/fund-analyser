const csv = require('./csv.js')
const Fund = require('../fund/Fund')
const StreamTest = require('streamtest')

describe('csv', () => {
    let funds, headerFields, csvHeader, csvRow
    beforeEach(() => {
        funds = [
            Fund.Builder('test')
                .name('Test fund')
                .type(Fund.types.UNIT)
                .shareClass(Fund.shareClasses.ACC)
                .frequency('Daily')
                .ocf(0.0007)
                .amc(0.0004)
                .entryCharge(0.01)
                .holdings([new Fund.Holding('Test Holding', 'TEST', 0)])
                .historicPrices([new Fund.HistoricPrice(new Date(2017, 3, 23), 457.0)])
                .returns({'5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2, '2W': -0.1, '1W': -0.05, '3D': -0.05, '1D': -0.05})
                .percentiles({ '5Y': 0.2, '3Y': 0.3, '1Y': 0.8, '6M': 0.75, '3M': 0.9, '1M': 0.4, '2W': 0.5, '1W': 0.2, '3D': 0.6, '1D': 0.6 })
                .indicators({
                    stability: -3
                })
                .asof(new Date(2018, 0, 1))
                .build()
        ]
        headerFields = ['isin', 'name', 'type', 'shareClass', 'frequency',
            'ocf', 'amc', 'entryCharge', 'exitCharge', 'bidAskSpread', 'returns.5Y', 'returns.3Y',
            'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'percentiles.5Y', 'percentiles.3Y',
            'percentiles.1Y', 'percentiles.6M', 'percentiles.3M', 'percentiles.1M', 'percentiles.2W',
            'percentiles.1W', 'percentiles.3D', 'percentiles.1D', 'indicators.stability', 'holdings', 'asof']

        csvHeader = `"ISIN","Name","Type","Share Class","Pricing Frequency","OCF","AMC","Entry Charge","Exit Charge","Bid-Ask Spread","returns.5Y","returns.3Y","returns.1Y","returns.6M","returns.3M","returns.1M","percentiles.5Y","percentiles.3Y","percentiles.1Y","percentiles.6M","percentiles.3M","percentiles.1M","percentiles.2W","percentiles.1W","percentiles.3D","percentiles.1D","Stability","Holdings","As of date"`
        csvRow = `"test","Test fund","UNIT","Acc","Daily","0.06999999999999999%","0.04%","1%","","","50%","-20%","30%","40%","0%","-20%","20%","30%","80%","75%","90%","40%","50%","20%","60%","60%",-3,"[{""name"":""Test Holding"",""symbol"":""TEST"",""weight"":0}]","2018-01-01T00:00:00.000Z"`
    })

    test('convert should convert Fund to csv', () => {
        const csvString = csv.convert(funds, headerFields)
        expect(csvString.split(/\r?\n/)).toEqual([csvHeader, csvRow])
    })
    test('convertStream should convert Fund to csv stream', () => {
        const version = 'v2'
        StreamTest[version].fromObjects(funds)
            .pipe(csv.convertStream(headerFields))
            .pipe(StreamTest[version].toObjects((err, [csvString]) => {
                expect(err).toBeUndefined()
                expect(csvString.split(/\r?\n/)).toEqual([csvHeader, csvRow])
            }))
    })
})
