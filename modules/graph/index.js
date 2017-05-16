import formulae from './formulae'

const isNum = value => !isNaN(value)
const isObj = obj => typeof obj === 'object'
const keyOf = obj => isObj(obj) ? Object.keys(obj)[0] : ''
const valueOf = obj => obj[keyOf(obj)]
const lastEntry = obj => isObj(obj) && obj[obj.length - 1]
const isNode = obj => !isObj(obj) ? true : Object.keys(obj).length === 1 && !isObj(valueOf(obj))
const isBranch = obj => Object.keys(obj).length > 1 || !isNode(lastEntry(obj))

const swap = (key, value) => `${value}${key}`
const filter = graph => isObj(graph) ? Object.keys(graph).filter(k => k !== 'unit') : []

const overrides = {
  '℃': '℃',
  '℉': '℉'
}

export const units = (path, to, key) => {
  const entry = lastEntry(path)
  key = key || keyOf(entry)

  let unit
  if (path.length) {
    unit = valueOf(entry).unit
    if (!unit) return units(path.slice(0, -1), to, key)
    if (isObj(unit) && key) {
      unit = unit[key]
    }
    to = to || overrides[unit]
    overrides[unit] = to
  }
  return to && to !== unit && unit.indexOf('_') < 0 ? `${unit}_${to}` : unit
}

export const contains = keys => path => keys.reduce((match, key) => {
  return match && key && (!!path.find(item => keyOf(item).startsWith(key)))
}, true)

export const map = key => {
  key = key.toLowerCase().trim()
  return formulae.map[key] || null
}

export const convert = (data => {
  const id = x => x
  const conv = Object.keys(data).reduce((obj, key) => {
    const [from, to] = key.split('_')
    const inv = `${to}_${from}`
    obj[key] = {[to]: data[key]}
    obj[inv] = {[from]: x => x * (1 / data[key](x))}
    obj[from] = {...(obj[from] || {}), [from]: id, [to]: obj[key][to]}
    obj[to] = {...(obj[to] || {}), [to]: id, [from]: obj[inv][from]}
    return obj
  }, {})
  return conv
})(formulae)

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

export function parse (input, history = []) {
  const inputs = input.split(/[\s,]+/).map(k => k.toString().toLowerCase().trim())
  const keys = []
  let unit
  const op = inputs.reduce((op, key, i) => {
    unit = unit || map(key)
    if (unit) {
      return op
    }

    // very limited memory - just split numbers from last key
    const next = key.replace(history[i], '')
    if (key !== history[i] && key.indexOf(history[i]) === 0 && !isNaN(next)) {
      keys.push(history[i])
      key = next
    }
    if ('x/*'.indexOf(key[0]) !== -1) {
      op = key[0]
      key = key.substr(1)
    }
    keys.push(key)
    return (op === '*' ? 'x' : op)
  }, 'x')

  const num = keys.filter(k => k).reduce((num, key) => isNum(key) ? Number(key) : num, 1)
  return [keys.filter(k => k && isNaN(k)), num, op, unit, inputs]
}

export const calculate = (entry, unit = null, num = 1, op = 'x') => {
  const key = keyOf(entry)
  const value = valueOf(entry)
  let calc
  if (isNum(value) && convert[unit]) {
    let cu = convert[unit]
    if (cu[unit]) {
      cu = cu[unit]
    } else {
      unit = keyOf(cu)
      cu = valueOf(cu)
    }
    switch (op) {
      case '/':
        calc = cu(value) / num
        break
      default:
        calc = cu(value) * num
        break
    }
    return `${key}${num !== 1 ? ` ${op} ${num}` : ''} = ${swap(unit, calc.toFixed(2))}`
  } else {
    return `${key} = ${value}`
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
  const used = []
  for (let key of keys) {
    if (!used.includes(key)) {
      used.push(key)
      for (let path of generatePath(graph, key)) {
        if (keysInPath(path)) {
          yield path
        }
      }
    }
  }
}

const generator = (dataGraph, aliasGraph) => {
  const alias = aliasReducer(aliasGraph)
  let history = []
  return function * input (input) {
    const [keys, num, op, unit, inputs] = parse(input, history)
    history = inputs
    const generateEntry = function * (path, units, isPath) {
      const entry = lastEntry(path)
      if (isBranch(path)) {
        const value = isNode(entry) ? path.slice(0, -1) : path
        yield {type: isPath ? 'node' : 'branch', value: alias(value)}
      }
      if (isNode(entry)) {
        yield {type: 'node', value: calculate(entry, units, num, op)}
      }
    }

    for (let path of generateList(dataGraph, keys)) {
      const entryUnits = units(path, unit)
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

export default generator
