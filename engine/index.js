import formulae from './formulae'

export const inv = unit => x => x * (1 / (formulae[unit] || unit)(1))

const keyOf = obj => Object.keys(obj)[0]

export const alias = (graph, path) => {
  const parts = []
  const traverse = (graph, key) => {
    let found = !!graph[key]
    Object.keys(graph).forEach(node => {
      if (typeof graph[node] !== 'object') {
        if (key === node) {
          parts.push(graph[node])
        }
      } else {
        found = found || traverse(graph[node], key)
      }
    })
    return found
  }
  path.forEach((item, idx) => {
    traverse(graph, keyOf(item))
    if (!parts.length && idx === path.length - 1) {
      parts.push(keyOf(item))
    }
  })

  return parts.join(' ')
}

export function generateNode (graph, node, filter) {
  const traverse = function * (graph, path) {
    for (let key of Object.keys(graph)) {
      const value = graph[key]
      const newPath = [].concat({[key]: value}, path)
      if (key.startsWith(node) && filter(newPath)) {
        yield newPath
      } else if (typeof value === 'object') {
        yield * traverse(value, newPath)
      }
    }
  }
  return traverse(graph, [])
}

function * calculate (path, num) {
  yield path
}

export const filter = keys => path => keys.reduce((match, key) => {
  return match && (!!path.find(item => keyOf(item).startsWith(key)) || !isNaN(key))
}, true)

function * generatePath (graph, nodes) {
  const cache = []
  let num
  const pathFilter = filter(nodes.map(n => n.toLowerCase()))
  for (let node of nodes) {
    if (!isNaN(node)) {
      num = Number(node)
      for (let value of cache) {
        yield * calculate(value, num)
      }
    }
    const it = generateNode(graph, node.toLowerCase(), pathFilter)
    for (let path = it.next(); !path.done; path = it.next()) {
      cache.push(path.value)
      yield * calculate(path.value, num)
    }
  }
}

export { formulae }
export default generatePath
