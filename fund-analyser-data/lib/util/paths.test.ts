import { getProjectRoot } from './paths'

describe('paths', () => {
  test('getProjectRoot should exist', () => {
    const projectRoot = getProjectRoot()
    expect(projectRoot).toEndWith('fund-analyser-data')
  })
})
