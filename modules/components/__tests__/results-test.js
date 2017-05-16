import Results from '../results'

describe('Results component', () => {
  describe('memoisation', () => {
    it('should return same instance when results unchanged', () => {
      const r1 = [{value: 1}, {value: 2}]
      const r2 = [{value: 1}, {value: 2}]
      expect(Results({results: r1})).toBe(Results({results: r2}))
    })
    it('should return new instance when results differ', () => {
      const r1 = [{value: 1}, {value: 2}]
      const r2 = [{value: 1}, {value: 3}]
      expect(Results({results: r1})).not.toBe(Results({results: r2}))
    })
  })
})
