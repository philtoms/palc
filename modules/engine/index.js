import formulae from './formulae'

const keyOf = obj => typeof obj === 'object' ? Object.keys(obj)[0] : ''
const valueOf = obj => obj[keyOf(obj)]
const lastEntry = path => valueOf(path[path.length - 1])
const isBranch = obj => typeof obj === 'object' && !['swap', 'calc'].includes(keyOf(obj))

export const inv = unit => x => x * (1 / (formulae[unit] || unit)(1))

const swap = (key, value) => `${value}${key}`

export const aliasReducer = root => path => {
  const traverse = (graph, keys, parts) => {
    let value
    let key = keys.shift()
    if (!key) return parts
    if (graph[key]) {
      if (typeof graph[key] !== 'object') {
        value = graph[key]
      } else {
        value = traverse(graph[key], keys, [])
        if (!Array.isArray(value) || !value.length) {
          value = [key].concat(value)
        }
      }
      return parts.concat(value)
    }

    value = lastEntry(path)
    // maybe use injected functions here
    if (!isBranch(value)) {
      return `${key} = ${value}`
    }
    switch (keyOf(value)) {
      case 'swap':
        return swap(key, value.swap)
      case 'calc':
//        return calc(key, value.calc)
      // eslint no-fallthrough
      default:
        return key
    }
  }

  const keys = path.map(keyOf)
  let parts = []
  while (keys.length) {
    parts = parts.concat(traverse(root, keys, []))
  }

  return parts.join(' ').trim()
}

function * calculate (path, num) {
  let units
  path = path.map(entry => {
    const value = valueOf(entry)
    if (!units) units = value.units
    if (!isNaN(value)) {
      return {[keyOf(entry)]: Math.trunc(value * num, 2)}
    }
    return entry
  })
  const acc = []
  for (let entry of path) {
    const key = keyOf(entry)
    const value = valueOf(entry)
    if (value.calc && units) {
      yield acc
      acc.length = 0
      for (let uk of Object.keys(units)) {
        yield [{[key]: swap(uk, (value.calc * units[uk].swap * num).toFixed(2))}]
      }
    } else {
      acc.push(entry)
    }
  }
  if (acc.length) {
    yield acc
  }
}

export const contains = keys => path => keys.reduce((match, key) => {
  return match && key && (!!path.find(item => keyOf(item).startsWith(key)))
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
  const allKeys = keys.map(n => n.toString().toLowerCase().trim()).filter(n => n)
  keys = allKeys.filter(k => isNaN(k))
  const keysInPath = contains(keys)
  const num = allKeys.reduce((num, key) => !isNaN(key) ? Number(key) : num, 1)
  for (let key of keys) {
    for (let path of generatePath(graph, key)) {
      if (keysInPath(path)) {
        yield * calculate(path, num)
        const value = lastEntry(path)
        if (isBranch(value)) {
          for (let key of Object.keys(value)) {
            yield * calculate(path.concat({[key]: value[key]}), num)
          }
        }
      }
    }
  }
}

const generator = (dataGraph, aliasGraph) => {
  const alias = aliasReducer(aliasGraph)
  return function * (keys) {
    for (let path of generateList(dataGraph, keys)) {
      const value = lastEntry(path)
      const type = isBranch(value) ? 'branch' : 'node'
      yield {
        type,
        value: alias(path)
      }
    }
  }
}

export { formulae }
export default generator
