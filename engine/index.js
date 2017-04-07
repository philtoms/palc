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
  return match && key && (!!path.find(item => keyOf(item).startsWith(key)) || !isNaN(key))
}, true)

export function * generatePath (graph, keys) {
  const cache = []
  const nodes = keys.map(n => n.toLowerCase().trim()).filter(n => n)
  let num
  const pathFilter = filter(nodes)
  for (let node of nodes) {
    if (!isNaN(node)) {
      num = Number(node)
      for (let value of cache) {
        yield * calculate(value, num)
      }
    }
    const it = generateNode(graph, node, pathFilter)
    for (let path = it.next(); !path.done; path = it.next()) {
      cache.push(path.value)
      yield * calculate(path.value, num)
    }
  }
}

const generateList = (dataGraph, aliasGraph) => {
  return function * (keys) {
    const cache = []
    const it = generatePath(dataGraph, keys)
    for (let path = it.next(); !path.done; path = it.next()) {
      const entry = alias(aliasGraph, path.value)
      if (!cache.includes(entry)) {
        cache.push(entry)
        yield entry
      }
    }
  }
}

export { formulae }
export default generateList
