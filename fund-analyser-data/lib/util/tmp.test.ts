import * as tmp from './tmp'

describe('tmp', () => {
  const key = 'key'
  const object = { message: 'Hello world!' }
  beforeEach(async () => {
    await tmp.clear()
  })
  test('clear should give clean directory', async () => {
    try {
      await tmp.read(key)
      throw new Error('Failed assertion')
    } catch (err) {
      expect(err).not.toBeUndefined()
    }
  })
  test('read should fail if file is expired', async () => {
    try {
      await tmp.write(key, object, -1)
      await tmp.read(key)
      throw new Error('Failed assertion')
    } catch (err) {
      expect(err).not.toBeUndefined()
    }
  })
  test('read should succeed if file hasn\'t expired', async () => {
    await tmp.write(key, object, 10)
    const actual = await tmp.read(key)
    expect(actual).toEqual(object)
  })
})
