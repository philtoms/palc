import formulae from './formulae'

export const inv = unit => x => x * (1 / (formulae[unit] || unit)(1))

const keyOf = obj => Object.keys(obj)[0]
const valueOf = obj => obj[keyOf(obj)]

export const alias = (graph, path) => {
  let parts = []
  const traverse = (graph, keys, path) => {
    let key = keys.shift()
    if (graph[key]) {
      if (typeof graph[key] !== 'object') {
        return graph[key]
      } else {
        return traverse(graph[key], keys, path.concat(key))
      }
    }
    return path.concat(key)
  }
  const keys = path.map(keyOf)
  while (keys.length) {
    parts = parts.concat(traverse(graph, keys, []))
  }

  return parts.join(' ').trim()
}

export function generateNode (graph, node, filter) {
  const traverse = function * (graph, path) {
    for (let key of Object.keys(graph)) {
      const value = graph[key]
      const newPath = path.concat({[key]: value})
      if (key.startsWith(node) && filter(newPath)) {
        yield newPath
      } else if (typeof value === 'object') {
        yield * traverse(value, newPath)
      }
    }
  }
  return traverse(graph, [])
}

function * calculate (path, num, depth) {
  const lastEntry = valueOf(path[path.length - 1])
  if (typeof lastEntry === 'object' && !depth) {
    for (let key of Object.keys(lastEntry)) {
      yield * calculate(path.concat({[key]: lastEntry[key]}), num, true)
    }
  } else {
    yield path
  }
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
