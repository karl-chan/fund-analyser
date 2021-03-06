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
    test('getSedols should return array of sedols', async () => {
      const pageRange = [1, 2]
      const sedols = ['SEDOL01', 'SEDOL02']
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getNumPages')
        .mockImplementation(async () => 2)
      jest.spyOn(charlesStanleyDirect, 'getPageRange')
        .mockImplementation(async () => pageRange)
      jest.spyOn(charlesStanleyDirect, 'getSedolsFromPage')
        .mockImplementation(async (page: number) => {
          switch (page) {
            case 1:
              return [sedols[0]]
            case 2:
              return [sedols[1]]
          }
        })
      jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
        .mockImplementation(async sedol => {
          switch (sedol) {
            case sedols[0]:
              return partialFunds[0]

            case sedols[1]:
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

    test('getSedolsFromPage should return array of sedols', async () => {
      const samplePage = 1
      const sedols = await charlesStanleyDirect.getSedolsFromPage(samplePage)
      expect(sedols).toBeArray()
      expect(sedols).toSatisfyAll(sedol => sedol.length === 7)
    })

    test('getFundFromSedol should return partial fund', async () => {
      const sedol = 'B39RMM8'
      const partialFund = await charlesStanleyDirect.getFundFromSedol(sedol)
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

    test('getSedolsFromPages should return array of sedols', async () => {
      const pages = [1, 2]

      jest.spyOn(charlesStanleyDirect, 'getSedolsFromPage')
        .mockImplementation(async page => {
          switch (page) {
            case 1:
              return ['SEDOL01', 'SEDOL02']
            case 2:
              return ['SEDOL03', 'SEDOL04']
          }
        })
      const sedols = await charlesStanleyDirect.getSedolsFromPages(pages)
      expect(sedols).toEqual(['SEDOL01', 'SEDOL02', 'SEDOL03', 'SEDOL04'])
    })

    test('getFundsFromSedols should return array of partial fund', async () => {
      const sedols = ['SEDOL01', 'SEDOL02']
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
        .mockImplementation(async sedol => {
          switch (sedol) {
            case 'SEDOL01':
              return partialFunds[0]

            case 'SEDOL02':
              return partialFunds[1]
          }
        })
      const isins = await charlesStanleyDirect.getFundsFromSedols(sedols)
      expect(isins).toEqual(partialFunds)
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
      jest.spyOn(charlesStanleyDirect, 'getSedolsFromPage')
        .mockImplementation(async page => {
          switch (page) {
            case 1:
              return ['SEDOL01']
            case 2:
              return ['SEDOL02']
          }
        })
      jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
        .mockImplementation(async sedol => {
          switch (sedol) {
            case 'SEDOL01':
              return partialFunds[0]

            case 'SEDOL02':
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
    test('streamSedolsFromPages should return Transform stream outputting array of sedols', done => {
      const pages = [1, 2]
      jest.spyOn(charlesStanleyDirect, 'getSedolsFromPage')
        .mockImplementation(async page => {
          switch (page) {
            case 1:
              return ['SEDOL01', 'SEDOL02']
            case 2:
              return ['SEDOL03', 'SEDOL04']
          }
        })

      const pageToSedolStream = charlesStanleyDirect.streamSedolsFromPages()
      StreamTest[version].fromObjects(pages)
        .pipe(pageToSedolStream)
        .pipe(StreamTest[version].toObjects((err, sedols) => {
          expect(sedols).toEqual(['SEDOL01', 'SEDOL02', 'SEDOL03', 'SEDOL04'])
          done(err)
        }))
    })
    test('streamFundsFromSedols should return Transform stream outputting array of partial funds', done => {
      const sedols = ['SEDOL01', 'SEDOL02']
      const partialFunds = [
        Fund.builder('GB00000ISIN1').bidAskSpread(0.01).build(),
        Fund.builder('GB00000ISIN2').bidAskSpread(0.02).build()
      ]

      jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
        .mockImplementation(async sedol => {
          switch (sedol) {
            case 'SEDOL01':
              return partialFunds[0]

            case 'SEDOL02':
              return partialFunds[1]
          }
        })

      const sedolToIsinStream = charlesStanleyDirect.streamFundsFromSedols()
      StreamTest[version].fromObjects(sedols)
        .pipe(sedolToIsinStream)
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
