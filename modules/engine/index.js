import formulae from './formulae'

const keyOf = obj => Object.keys(obj)[0]
const valueOf = obj => obj[keyOf(obj)]
const lastEntry = path => valueOf(path[path.length - 1])

export const inv = unit => x => x * (1 / (formulae[unit] || unit)(1))

export const aliasReducer = root => path => {
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
  let parts = []
  while (keys.length) {
    parts = parts.concat(traverse(root, keys, []))
  }

  return parts.join(' ').trim()
}

function * calculate (path, num, depth) {
  const last = lastEntry(path)
  if (typeof last === 'object' && !depth) {
    for (let key of Object.keys(last)) {
      const newPath = path.concat({[key]: last[key]})
      yield * calculate(newPath, num, true)
    }
  } else {
    yield path
  }
}

export const contains = keys => path => keys.reduce((match, key) => {
  return match && key && (!!path.find(item => keyOf(item).startsWith(key)) || !isNaN(key))
}, true)

export function generatePath (root, match) {
  const traverse = function * (graph, path) {
    for (let key of Object.keys(graph)) {
      const value = graph[key]
      const newPath = path.concat({[key]: value})
      if (key.startsWith(match)) {
        yield newPath
      } else if (typeof value === 'object') {
        yield * traverse(value, newPath)
      }
    }
  }
  return traverse(root, [])
}

export function * generateList (graph, keys) {
  const cache = {}
  const allKeys = keys.map(n => n.toString().toLowerCase().trim()).filter(n => n)
  keys = allKeys.filter(k => isNaN(k))
  const keysInPath = contains(keys)
  const num = allKeys.reduce((num, key) => !isNaN(key) ? Number(key) : num, 0)

  for (let key of keys) {
    for (let value of generatePath(graph, key)) {
      const pathKey = keyOf(lastEntry(value))
      if (!cache[pathKey] && keysInPath(value)) {
        cache[pathKey] = value
        yield * calculate(value, num)
      }
    }
  }
}

const generator = dataGraph => {
  return function * (keys) {
    return generateList(dataGraph, keys)
  }
}

export { formulae }
export default generator
