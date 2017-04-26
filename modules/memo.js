
const idTest = (p1, p2) => p1 !== p2

export default (test = idTest) => {
  let cache
  let component
  return Component => props => {
    if (cache === undefined || test(props, cache)) {
      cache = props
      component = Component(props)
    }
    return component
  }
}
