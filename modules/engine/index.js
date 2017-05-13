import formulae from './formulae'

const isNum = value => !isNaN(value)
const isObj = obj => typeof obj === 'object'
const keyOf = obj => isObj(obj) ? Object.keys(obj)[0] : ''
const valueOf = obj => obj[keyOf(obj)]
const lastEntry = obj => isObj(obj) && obj[obj.length - 1]
const isNode = obj => !isObj(obj) ? true : Object.keys(obj).length === 1 && !isObj(valueOf(obj))
const isBranch = obj => Object.keys(obj).length > 1 || !isNode(lastEntry(obj))

export const inv = unit => x => x * (1 / (formulae[unit] || unit)(1))
const swap = (key, value) => `${value}${key}`
const filter = graph => isObj(graph) ? Object.keys(graph).filter(k => k !== 'units') : []
const units = path => valueOf(path[0]).units

export const contains = keys => path => keys.reduce((match, key) => {
  return match && key && (!!path.find(item => keyOf(item).startsWith(key)))
}, true)

export const aliasReducer = graph => path => {
  const traverse = (accum, entry) => {
    const key = keyOf(entry)
    const alias = accum.graph[key]
    const isAlias = typeof alias === 'string'
    if (isAlias) {
      while (accum.value.pop() !== '') {}
      return {graph, value: accum.value.concat(alias, '')}
    }
    return {graph: alias || graph, value: accum.value.concat(key)}
  }
  return path.reduce(traverse, {graph, value: ['']}).value.filter(k => k).join(', ').trim()
}

function * calculate (entry, num, units) {
  const key = keyOf(entry)
  const value = valueOf(entry)
  if (isNum(value) && units) {
    for (let uk of Object.keys(units)) {
      yield `${key} = ${swap(uk, (value * units[uk] * num).toFixed(2))}`
    }
  } else {
    yield `${keyOf(entry)} = ${valueOf(entry)}`
  }
}

export function generatePath (root, match) {
  const traverse = function * (graph, path) {
    for (let key of filter(graph)) {
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
  const keysInPath = contains(keys)
  for (let key of keys) {
    for (let path of generatePath(graph, key)) {
      if (keysInPath(path)) {
        yield path
      }
    }
  }
}

const generator = (dataGraph, aliasGraph) => {
  const alias = aliasReducer(aliasGraph)
  return function * (keys) {
    const num = keys.reduce((num, key) => isNum(key) ? Number(key) : num, 1)
    keys = keys.map(k => k.toString().toLowerCase().trim()).filter(k => k && isNaN(k))

    const generateEntry = function * (path, units, isPath) {
      const entry = lastEntry(path)
      if (isBranch(path)) {
        const value = isNode(entry) ? path.slice(0, -1) : path
        yield {type: isPath ? 'node' : 'branch', value: alias(value)}
      }
      if (isNode(entry)) {
        for (let value of calculate(entry, num, units)) {
          yield {type: 'node', value}
        }
      }
    }

    for (let path of generateList(dataGraph, keys)) {
      const entryUnits = units(path)
      yield * generateEntry(path, entryUnits)
      if (isBranch(path)) {
        const nodes = valueOf(lastEntry(path))
        for (let key of filter(nodes)) {
          const node = {[key]: nodes[key]}
          const entry = isNode(node) ? [node] : path.concat(node)
          yield * generateEntry(entry, entryUnits, true)
        }
      }
    }
  }
}

export { formulae }
export default generator
