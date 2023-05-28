import * as _ from 'lodash'
import * as StreamTest from 'streamtest'
import CharlesStanleyDirect from './CharlesStanleyDirect'
import Fund from './Fund'

jest.setTimeout(30000) // 30 seconds

describe('CharlesStanleyDirect', () => {
  let charlesStanleyDirect: CharlesStanleyDirect
  beforeEach(() => {
    charlesStanleyDirect = new CharlesStanleyDirect()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Core methods', () => {
    test('getInvestments should return array of investment ids', async () => {
      const pageRange = [1, 2]
      const investmentIds = ['investmentId01%3D', 'investmentId02%3D']
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getNumPages')
        .mockImplementation(async () => 2)
      jest.spyOn(charlesStanleyDirect, 'getPageRange')
        .mockImplementation(async () => pageRange)
      jest.spyOn(charlesStanleyDirect, 'getInvestmentIdsFromPage')
        .mockImplementation(async (page: number) => {
          switch (page) {
            case 1:
              return [investmentIds[0]]
            case 2:
              return [investmentIds[1]]
          }
        })
      jest.spyOn(charlesStanleyDirect, 'getFundFromInvestmentId')
        .mockImplementation(async investmentId => {
          switch (investmentId) {
            case investmentIds[0]:
              return partialFunds[0]

            case investmentIds[1]:
              return partialFunds[1]
          }
        })

      const actual = await charlesStanleyDirect.getFunds()
      expect(actual).toEqual(partialFunds)
    })

    test('getNumPages should return positive integer', async () => {
      const numPages = await charlesStanleyDirect.getNumPages()
      expect(numPages).toBeGreaterThan(80)
    })

    test('getInvestmentIdsFromPage should return array of investment ids', async () => {
      const samplePage = 1
      const investmentIds = await charlesStanleyDirect.getInvestmentIdsFromPage(samplePage)
      expect(investmentIds).toBeArray()
      expect(investmentIds).toSatisfyAll(investmentId =>
        investmentId.length === 14 ||
        investmentId.length === 16 ||
        investmentId.length === 18)
      expect(investmentIds).toSatisfyAll(investmentId => investmentId.endsWith('%3D'))
    })

    test('getFundFromInvestmentId should return partial fund', async () => {
      const investmentId = 'cy81gyZgAx8%3D'
      const partialFund = await charlesStanleyDirect.getFundFromInvestmentId(investmentId)
      expect(partialFund).toHaveProperty('isin', 'GB00B39RMM81')
      expect(partialFund).toHaveProperty('bidAskSpread', 0)
      expect(partialFund).toHaveProperty('entryCharge', 0)
      expect(partialFund).toHaveProperty('amc', expect.toBeWithin(0, 1))
      expect(partialFund).toHaveProperty('ocf', expect.toBeWithin(0, 1))
      expect(partialFund).toHaveProperty('holdings')
      expect(partialFund.holdings).toBeArrayOfSize(10).toSatisfyAll(holding => {
        return typeof holding.name === 'string' && holding.name &&
                       typeof holding.weight === 'number' && holding.weight > 0
      })
    })

    test('getPageRange should return array of consecutive ints', async () => {
      const lastPage = 71
      const pageRange = await charlesStanleyDirect.getPageRange(lastPage)
      expect(pageRange).toEqual(_.range(1, lastPage + 1))
    })

    test('getInvestmentIdsFromPages should return array of investment ids', async () => {
      const pages = [1, 2]

      jest.spyOn(charlesStanleyDirect, 'getInvestmentIdsFromPage')
        .mockImplementation(async page => {
          switch (page) {
            case 1:
              return ['investmentId01%3D', 'investmentId02%3D']
            case 2:
              return ['investmentId03%3D', 'investmentId04%3D']
          }
        })
      const investmentIds = await charlesStanleyDirect.getInvestmentIdsFromPages(pages)
      expect(investmentIds).toEqual(['investmentId01%3D', 'investmentId02%3D', 'investmentId03%3D', 'investmentId04%3D'])
    })

    test('getFundsFromInvestmentIds should return array of partial fund', async () => {
      const investmentIds = ['investmentId01%3D', 'investmentId02%3D']
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getFundFromInvestmentId')
        .mockImplementation(async investmentId => {
          switch (investmentId) {
            case 'investmentId01%3D':
              return partialFunds[0]

            case 'investmentId02%3D':
              return partialFunds[1]
          }
        })
      const funds = await charlesStanleyDirect.getFundsFromInvestmentIds(investmentIds)
      expect(funds).toEqual(partialFunds)
    })
  })

  describe('Stream methods', () => {
    const version = 'v2'
    test('streamFunds should return Readable stream outputting array of partial funds', done => {
      const pageRange = [1, 2]
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getNumPages')
        .mockImplementation(async () => 2)
      jest.spyOn(charlesStanleyDirect, 'getPageRange')
        .mockImplementation(async () => pageRange)
      jest.spyOn(charlesStanleyDirect, 'getInvestmentIdsFromPage')
        .mockImplementation(async page => {
          switch (page) {
            case 1:
              return ['investmentId01%3D']
            case 2:
              return ['investmentId02%3D']
          }
        })
      jest.spyOn(charlesStanleyDirect, 'getFundFromInvestmentId')
        .mockImplementation(async investmentId => {
          switch (investmentId) {
            case 'investmentId01%3D':
              return partialFunds[0]

            case 'investmentId02%3D':
              return partialFunds[1]
          }
        })

      const isinStream = charlesStanleyDirect.streamFunds()
      isinStream
        .pipe(StreamTest[version].toObjects((err, actual) => {
          expect(actual).toEqual(partialFunds)
          done(err)
        }))
    })
    test('streamNumPages should return Readable stream with single element', done => {
      jest.spyOn(charlesStanleyDirect, 'getNumPages')
        .mockImplementation(async () => 71)

      const numPagesStream = charlesStanleyDirect.streamNumPages()
      numPagesStream.pipe(StreamTest[version].toObjects((err, objs) => {
        expect(objs).toEqual([71])
        done(err)
      }))
    })
    test('streamPageRange should return Transform stream outputting array of consecutive ints', done => {
      const lastPage = 71
      jest.spyOn(charlesStanleyDirect, 'getPageRange')
        .mockImplementation(async lastPage => {
          expect(lastPage).toBe(71)
          return _.range(1, 72)
        })

      const pageRangeStream = charlesStanleyDirect.streamPageRange()
      StreamTest[version].fromObjects([lastPage])
        .pipe(pageRangeStream)
        .pipe(StreamTest[version].toObjects((err, pageRange) => {
          expect(pageRange).toEqual(_.range(1, 72))
          done(err)
        }))
    })
    test('streamInvestmentIdsFromPages should return Transform stream outputting array of investment ids', done => {
      const pages = [1, 2]
      jest.spyOn(charlesStanleyDirect, 'getInvestmentIdsFromPage')
        .mockImplementation(async page => {
          switch (page) {
            case 1:
              return ['investmentId01%3D', 'investmentId02%3D']
            case 2:
              return ['investmentId03%3D', 'investmentId04%3D']
          }
        })

      const pageToInvestmentIdsStream = charlesStanleyDirect.streamInvestmentIdsFromPages()
      StreamTest[version].fromObjects(pages)
        .pipe(pageToInvestmentIdsStream)
        .pipe(StreamTest[version].toObjects((err, investmentIds) => {
          expect(investmentIds).toEqual(['investmentId01%3D', 'investmentId02%3D', 'investmentId03%3D', 'investmentId04%3D'])
          done(err)
        }))
    })
    test('streamFundsFromInvestmentIds should return Transform stream outputting array of partial funds', done => {
      const investmentIds = ['investmentId01%3D', 'investmentId02%3D']
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getFundFromInvestmentId')
        .mockImplementation(async investmentId => {
          switch (investmentId) {
            case 'investmentId01%3D':
              return partialFunds[0]

            case 'investmentId02%3D':
              return partialFunds[1]
          }
        })

      const investmentIdToIsinStream = charlesStanleyDirect.streamFundsFromInvestmentIds()
      StreamTest[version].fromObjects(investmentIds)
        .pipe(investmentIdToIsinStream)
        .pipe(StreamTest[version].toObjects((err, isins) => {
          expect(isins).toEqual(partialFunds)
          done(err)
        }))
    })
  })

  describe('Miscellaneous methods', () => {
    test('healthcheck should return boolean', async () => {
      const isUp = await charlesStanleyDirect.healthCheck()
      expect(isUp).toBeBoolean()
    })
  })
})
