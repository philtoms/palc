import memo from '../memo'

describe('memo', () => {
  it('should remember simple props', () => {
    const fn = memo()(p1 => ({p1}))
    expect(fn(1)).toBe(fn(1))
  })
  it('should remember object props', () => {
    const fn = memo()(p1 => ({p1}))
    const obj = {}
    expect(fn(obj)).toBe(fn(obj))
  })
  it('should reset new object props', () => {
    const fn = memo()(p1 => ({p1}))
    const obj = {}
    expect(fn(obj)).not.toBe(fn({}))
  })
  it('should accept custom test fn', () => {
    const test = (p1, p2) => p1.v !== p2.v
    const fn = memo(test)(p1 => ({p1}))
    expect(fn({v: 1})).toBe(fn({v: 1}))
  })
})
