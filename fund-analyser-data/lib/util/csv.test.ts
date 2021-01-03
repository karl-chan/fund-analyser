import * as csv from './csv'
import Fund from '../fund/Fund'

describe('csv', () => {
  let funds: any, headerFields: any, csvHeader: any, csvRow: any
  beforeEach(() => {
    funds = [
      Fund.builder('test')
        .name('Test fund')
        .type(Fund.types.UNIT)
        .shareClass(Fund.shareClasses.ACC)
        .frequency('Daily')
        .ocf(0.0007)
        .amc(0.0004)
        .entryCharge(0.01)
        .holdings([new Fund.Holding('Test Holding', 'TEST', 0)])
        .historicPrices([new Fund.HistoricPrice(new Date(2017, 3, 23), 457.0)])
        .returns({ '5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2, '2W': -0.1, '1W': -0.05, '3D': -0.05, '1D': -0.05 })
        .indicators({
          stability: {
            value: -3
          }
        })
        .asof(new Date(2018, 0, 1))
        .build()
    ]
    headerFields = ['isin', 'name', 'type', 'shareClass', 'frequency',
      'ocf', 'amc', 'entryCharge', 'exitCharge', 'bidAskSpread', 'returns.5Y', 'returns.3Y',
      'returns.1Y', 'returns.6M', 'returns.3M', 'returns.1M', 'indicators.stability', 'holdings', 'asof']

    csvHeader = '"ISIN","Name","Type","Share Class","Pricing Frequency","OCF","AMC","Entry Charge","Exit Charge","Bid-Ask Spread","returns.5Y","returns.3Y","returns.1Y","returns.6M","returns.3M","returns.1M","Stability","Holdings","As of date"'
    csvRow = '"test","Test fund","UNIT","Acc","Daily","0.06999999999999999%","0.04%","1%","","","50%","-20%","30%","40%","0%","-20%",-3,"[{""name"":""Test Holding"",""symbol"":""TEST"",""weight"":0}]","2018-01-01T00:00:00.000Z"'
  })

  test('convert should convert Fund to csv', () => {
    const csvString = csv.convert(funds, headerFields)
    expect(csvString.split(/\r?\n/)).toEqual([csvHeader, csvRow])
  })
})
