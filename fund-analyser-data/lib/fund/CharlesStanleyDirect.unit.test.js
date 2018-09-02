const CharlesStanleyDirect = require('./CharlesStanleyDirect.js')
const Fund = require('./Fund.js')

const TIMEOUT = 30000 // 30 seconds

const _ = require('lodash')
const StreamTest = require('streamtest')

describe('CharlesStanleyDirect', () => {
    jest.setTimeout(TIMEOUT)
    let charlesStanleyDirect
    beforeEach(() => {
        charlesStanleyDirect = new CharlesStanleyDirect()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Core methods', () => {
        test('getSedols should return array of sedols', done => {
            const pageRange = [1, 2]
            const sedols = ['SEDOL01', 'SEDOL02']
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ]

            jest.spyOn(charlesStanleyDirect, 'getPageRange')
                .mockImplementation((lastPage, callback) => {
                    callback(null, pageRange)
                })
            jest.spyOn(charlesStanleyDirect, 'getSedolsFromPages')
                .mockImplementation((pages, callback) => {
                    callback(null, sedols)
                })
            jest.spyOn(charlesStanleyDirect, 'getFundsFromSedols')
                .mockImplementation((sedols, callback) => {
                    callback(null, partialFunds)
                })

            charlesStanleyDirect.getFunds((err, actual) => {
                expect(actual).toEqual(partialFunds)
                done(err)
            })
        })

        test('getNumPages should return positive integer', done => {
            charlesStanleyDirect.getNumPages((err, numPages) => {
                expect(numPages).toBeGreaterThan(80)
                done(err)
            })
        })

        test('getSedolsFromPage should return array of sedols', done => {
            const samplePage = 1
            charlesStanleyDirect.getSedolsFromPage(samplePage, (err, sedols) => {
                expect(sedols).toBeArray()
                expect(sedols).toSatisfyAll(sedol => sedol.length === 7)
                done(err)
            })
        })

        test('getFundFromSedol should return partial fund', done => {
            const sedol = 'B8N44B3'
            charlesStanleyDirect.getFundFromSedol(sedol, (err, partialFund) => {
                expect(partialFund).toHaveProperty('isin', 'GB00B8N44B34')
                expect(partialFund).toHaveProperty('bidAskSpread')
                expect(partialFund).toHaveProperty('entryCharge')
                expect(partialFund.bidAskSpread).toBeNumber()
                expect(partialFund.entryCharge).toBeNumber()
                done(err)
            })
        })

        test('getPageRange should return array of consecutive ints', done => {
            const lastPage = 71
            charlesStanleyDirect.getPageRange(lastPage, (err, pageRange) => {
                expect(pageRange).toEqual(_.range(1, lastPage + 1))
                done(err)
            })
        })

        test('getSedolsFromPages should return array of sedols', done => {
            const pages = [1, 2]

            jest.spyOn(charlesStanleyDirect, 'getSedolsFromPage')
                .mockImplementation((page, callback) => {
                    switch (page) {
                    case 1:
                        callback(null, ['SEDOL01', 'SEDOL02'])
                        return
                    case 2:
                        callback(null, ['SEDOL03', 'SEDOL04'])
                    }
                })
            charlesStanleyDirect.getSedolsFromPages(pages, (err, sedols) => {
                expect(sedols).toEqual(['SEDOL01', 'SEDOL02', 'SEDOL03', 'SEDOL04'])
                done(err)
            })
        })

        test('getFundsFromSedols should return array of partial fund', done => {
            const sedols = ['SEDOL01', 'SEDOL02']
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ]

            jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
                .mockImplementation((sedol, callback) => {
                    switch (sedol) {
                    case 'SEDOL01':
                        callback(null, partialFunds[0])
                        return
                    case 'SEDOL02':
                        callback(null, partialFunds[1])
                    }
                })
            charlesStanleyDirect.getFundsFromSedols(sedols, (err, isins) => {
                expect(isins).toEqual(partialFunds)
                done(err)
            })
        })
    })

    describe('Stream methods', () => {
        const version = 'v2'
        test('streamFunds should return Readable stream outputting array of partial funds', done => {
            const pageRange = [1, 2]
            const partialFunds = [
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ]

            jest.spyOn(charlesStanleyDirect, 'getNumPages')
                .mockImplementation(callback => {
                    callback(null, 2)
                })
            jest.spyOn(charlesStanleyDirect, 'getPageRange')
                .mockImplementation((lastPage, callback) => {
                    callback(null, pageRange)
                })
            jest.spyOn(charlesStanleyDirect, 'getSedolsFromPage')
                .mockImplementation((page, callback) => {
                    switch (page) {
                    case 1:
                        callback(null, ['SEDOL01'])
                        return
                    case 2:
                        callback(null, ['SEDOL02'])
                    }
                })
            jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
                .mockImplementation((sedol, callback) => {
                    switch (sedol) {
                    case 'SEDOL01':
                        callback(null, partialFunds[0])
                        return
                    case 'SEDOL02':
                        callback(null, partialFunds[1])
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
                .mockImplementation(callback => {
                    callback(null, 71)
                })

            const numPagesStream = charlesStanleyDirect.streamNumPages()
            numPagesStream.pipe(StreamTest[version].toObjects((err, objs) => {
                expect(objs).toEqual([71])
                done(err)
            }))
        })
        test('streamPageRange should return Transform stream outputting array of consecutive ints', done => {
            const lastPage = 71
            jest.spyOn(charlesStanleyDirect, 'getPageRange')
                .mockImplementation((lastPage, callback) => {
                    expect(lastPage).toBe(71)
                    callback(null, _.range(1, 72))
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
                .mockImplementation((page, callback) => {
                    switch (page) {
                    case 1:
                        callback(null, ['SEDOL01', 'SEDOL02'])
                        return
                    case 2:
                        callback(null, ['SEDOL03', 'SEDOL04'])
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
                Fund.Builder('GB00000ISIN1').bidAskSpread(0.01),
                Fund.Builder('GB00000ISIN2').bidAskSpread(0.02)
            ]

            jest.spyOn(charlesStanleyDirect, 'getFundFromSedol')
                .mockImplementation((sedol, callback) => {
                    switch (sedol) {
                    case 'SEDOL01':
                        callback(null, partialFunds[0])
                        return
                    case 'SEDOL02':
                        callback(null, partialFunds[1])
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
})
