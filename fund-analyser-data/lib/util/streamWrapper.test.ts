import { Promise } from 'bluebird'
import * as streamWrapper from './streamWrapper'
import * as StreamTest from 'streamtest'

describe('streamWraper', () => {
  const version = 'v2'
  test('asReadableAsync', (done: any) => {
    const source = async (x: any) => [1, 2, 3, 4, 5]
    const readableStream = streamWrapper.asReadableAsync(source)

    readableStream
      .pipe(StreamTest[version].toObjects((err: any, output: any) => {
        expect(err).toBeNull()
        expect(output).toEqual([1, 2, 3, 4, 5])
        done()
      }))
  })
  test('asWritableAsync', (done: any) => {
    const spy = jest.fn()
    const sink = async (x: any) => { spy(x) }
    const writableStream = streamWrapper.asWritableAsync(sink)

    const stream = StreamTest[version].fromObjects([1, 2, 3, 4, 5])
      .pipe(writableStream)
    stream.on('finish', () => {
      expect(spy.mock.calls.length).toBe(5)
      expect(spy.mock.calls.map((call: any) => call[0])).toEqual([1, 2, 3, 4, 5])
      done()
    })
  })
  test('asTransformAsync', (done: any) => {
    const divTwo = async (x: any) => x / 2
    const transformStream = streamWrapper.asTransformAsync(divTwo)

    StreamTest[version].fromObjects([1, 2, 3, 4, 5])
      .pipe(transformStream)
      .pipe(StreamTest[version].toObjects((err: any, output: any) => {
        expect(err).toBeNull()
        expect(output).toEqual([0.5, 1, 1.5, 2, 2.5])
        done()
      }))
  })
  test('asFilterAsync', (done: any) => {
    const isEven = async (x: any) => x % 2 === 0
    const filterStream = streamWrapper.asFilterAsync(isEven)

    StreamTest[version].fromObjects([1, 2, 3, 4, 5])
      .pipe(filterStream)
      .pipe(StreamTest[version].toObjects((err: any, output: any) => {
        expect(err).toBeNull()
        expect(output).toEqual([2, 4])
        done()
      }))
  })
  test('asParallelTransformAsync', (done: any) => {
    const divTwoSlow = async (x: any) => new Promise((resolve, reject) => {
      setTimeout(() => resolve(x / 2), Math.random() * 100)
    })
    const parallelTransformStream = streamWrapper.asParallelTransformAsync(divTwoSlow)

    StreamTest[version].fromObjects([1, 2, 3, 4, 5])
      .pipe(parallelTransformStream)
      .pipe(StreamTest[version].toObjects((err: any, output: any) => {
        expect(err).toBeNull()
        expect(output).toEqual([0.5, 1, 1.5, 2, 2.5])
        done()
      }))
  })
})
