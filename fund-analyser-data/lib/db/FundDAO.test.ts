import * as _ from 'lodash'
import * as StreamTest from 'streamtest'
import Fund from '../fund/Fund'
import * as db from '../util/db'
import * as FundDAO from './FundDAO'

jest.setTimeout(30000) // 30 seconds

describe('FundDAO', function () {
  let fund: Fund, doc: object
  beforeAll(async () => {
    await db.init()
    await FundDAO.deleteFunds({ query: { isin: /test/ } })
  })
  afterAll(async () => {
    await FundDAO.deleteFunds({ query: { isin: /test/ } })
    await db.close()
  })
  beforeEach(function () {
    fund = Fund.builder('test')
      .sedol('SEDOL01')
      .name('Test fund')
      .type(Fund.types.UNIT)
      .shareClass(Fund.shareClasses.ACC)
      .frequency('Daily')
      .ocf(0.0007)
      .amc(0.0004)
      .entryCharge(0)
      .exitCharge(0)
      .holdings([new Fund.Holding('Test Holding', 'TEST', 0)])
      .historicPrices([new Fund.HistoricPrice(new Date(2017, 3, 23), 457.0)])
      .returns({ '5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2 })
      .indicators({
        stability: { value: -3 }
      })
      .realTimeDetails({ estChange: 0.01, estPrice: 457.0, stdev: 1.0, ci: [456.0, 458.0], holdings: [], lastUpdated: new Date(2017, 3, 23) })
      .build()
    doc = {
      _id: 'SEDOL01',
      isin: 'test',
      sedol: 'SEDOL01',
      name: 'Test fund',
      type: Fund.types.UNIT,
      shareClass: Fund.shareClasses.ACC,
      frequency: 'Daily',
      ocf: 0.0007,
      amc: 0.0004,
      entryCharge: 0,
      exitCharge: 0,
      bidAskSpread: undefined,
      holdings: [{
        name: 'Test Holding',
        symbol: 'TEST',
        weight: 0
      }],
      historicPrices: [{
        date: new Date(2017, 3, 23),
        price: 457.0
      }],
      returns: { '5Y': 0.5, '3Y': -0.2, '1Y': 0.3, '6M': 0.4, '3M': 0, '1M': -0.2 },
      asof: undefined,
      indicators: {
        stability: { value: -3 }
      },
      realTimeDetails: { estChange: 0.01, estPrice: 457.0, stdev: 1.0, ci: [456.0, 458.0], holdings: [], lastUpdated: new Date(2017, 3, 23) }
    }
  })
  test('fromFund should return plain object', function () {
    const actual = FundDAO.fromFund(fund)
    expect(_.isPlainObject(actual)).toBeTrue()
    expect(actual).toEqual(doc)
  })
  test('toFund should return Fund object', function () {
    const actual = FundDAO.toFund(doc)
    expect(actual).toBeInstanceOf(Fund)
    expect(actual).toEqual(fund)
  })

  test('listFunds', async () => {
    await FundDAO.upsertFunds([fund])
    const funds = await FundDAO.listFunds({ query: { isin: fund.isin } })
    expect(funds).toBeArrayOfSize(1)
    expect(funds[0]).toEqual(fund)

    const sedols = await FundDAO.listFunds({ query: { isin: fund.isin }, projection: { _id: 0, sedol: 1 } }, true)
    expect(sedols).toBeArrayOfSize(1)
    expect(sedols[0]).toContainAllKeys(['sedol']) // only 'sedol' and not other keys
  })
  test('streamFunds', async () => {
    const version = 'v2'
    await FundDAO.upsertFunds([fund])

    const actual: Fund[] =
      await new Promise((resolve, reject) =>
        FundDAO.streamFunds({ query: { isin: fund.isin } })
          .pipe(StreamTest[version].toObjects((err, actual: Fund[]) => {
            err ? reject(err) : resolve(actual)
          })))
    expect(actual).toBeArrayOfSize(1)
    expect(actual[0]).toEqual(fund)
  })
  test('upsertFunds', async () => {
    // insert fund
    await FundDAO.upsertFunds([fund])
    let funds = await FundDAO.listFunds({ query: { isin: fund.isin } })
    expect(funds).toBeArrayOfSize(1)
    expect(funds[0]).toEqual(fund)

    // modify fund and upsert again
    fund = fund
      .toBuilder()
      .name('Modified name')
      .build()
    await FundDAO.upsertFunds([fund])
    funds = await FundDAO.listFunds({ query: { isin: fund.isin } })
    expect(funds).toBeArrayOfSize(1)
    expect(funds[0]).toHaveProperty('name', 'Modified name')
  })
  test('deleteFunds', async () => {
    await FundDAO.upsertFunds([fund])
    let funds = await FundDAO.listFunds({ query: { isin: fund.isin } })
    expect(funds).toBeArrayOfSize(1)

    await FundDAO.deleteFunds({ query: { isin: 'bad isin' } })
    funds = await FundDAO.listFunds({ query: { isin: fund.isin } })
    expect(funds).toBeArrayOfSize(1)

    await FundDAO.deleteFunds({ query: { isin: fund.isin } })
    funds = await FundDAO.listFunds({ query: { isin: fund.isin } })
    expect(funds).toBeArrayOfSize(0)
  })
  test('search should return relevant results', async () => {
    await FundDAO.upsertFunds([fund])
    const funds = await FundDAO.search('test', { sedol: 1, isin: 1 }, 1)
    expect(funds).toBeArrayOfSize(1)
    expect(funds[0].sedol).toBe(fund.sedol)
    expect(funds[0].isin).toBe(fund.isin)
    expect(funds[0].score).toBePositive()
  })
})
