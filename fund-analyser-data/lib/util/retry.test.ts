import retry from './retry'
const { performance } = require('perf_hooks')

jest.setTimeout(10000) // 10 seconds

describe('retry', () => {
  describe('base case with default options', () => {
    test('should fail on first attempt', async () => {
      const task = jest.fn().mockRejectedValue(-1)
      expect(retry(task)).rejects.toBe(-1)
    })

    test('should pass on first attempt', async () => {
      const task = jest.fn().mockResolvedValue(2)
      expect(retry(task)).resolves.toBe(2)
    })
  })

  describe('with max attempts', () => {
    const options = {
      maxAttempts: 2
    }
    test('should fail after reaching max attempts', async () => {
      const task = jest.fn()
        .mockRejectedValueOnce(-1)
        .mockRejectedValueOnce(-2)
        .mockRejectedValueOnce(-3)
      expect(retry(task, options)).rejects.toBe(-2)
    })
    test('should pass before reaching max attempts', async () => {
      const task = jest.fn()
        .mockRejectedValueOnce(-1)
        .mockResolvedValueOnce(2)
      expect(retry(task, options)).resolves.toBe(2)
    })
  })

  describe('with retry interval', () => {
    const options = {
      maxAttempts: 5,
      retryInterval: 200
    }
    test('should retry at specified intervals', async () => {
      const task = jest.fn()
        .mockRejectedValueOnce(-1)
        .mockRejectedValueOnce(-2)
        .mockResolvedValueOnce(3)
      const begin = performance.now()
      await retry(task, options)
      const end = performance.now()
      const timeTaken = end - begin
      expect(timeTaken).toBeWithin(300, 500)
    })
  })
})
