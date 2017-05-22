import formulae from './formulae'

const isNum = value => toNum(value) !== undefined
const isObj = obj => typeof obj === 'object'
const keyOf = obj => isObj(obj) ? Object.keys(obj)[0] : ''
const valueOf = obj => obj[keyOf(obj)]
const lastEntry = obj => isObj(obj) && obj[obj.length - 1]
const isNode = obj => !isObj(obj) ? true : Object.keys(obj).length === 1 && !isObj(valueOf(obj))
const isBranch = obj => Object.keys(obj).length > 1 || !isNode(lastEntry(obj))

const swap = (key, value) => `${value}${key}`
const filter = graph => isObj(graph) ? Object.keys(graph).filter(k => k !== 'unit') : []

const overrides = {}

export const setUnits = (path, units = [], keys = []) => {
  const entry = lastEntry(path)
  keys.push(keyOf(entry))
  let to = units.pop()
  let unit
  if (path.length) {
    unit = valueOf(entry).unit
    if (!unit) return setUnits(path.slice(0, -1), [to], keys)
    if (isObj(unit)) {
      unit = keys.reduce((u, key) => (u = u || unit[key]), undefined)
    }
    to = to || overrides[unit]
    overrides[unit] = to
  }
  const conv = `${unit}_${to}`
  return convert[conv] && to && to !== unit && unit.indexOf('_') < 0 ? conv : unit
}

export const contains = keys => path => keys.every((match) => {
  return path.some(item => keyOf(item).startsWith(match))
})

export const graphContains = (match, graph) => {
  const key = keyOf(graph)
  const value = valueOf(graph)
  const r = (key.startsWith(match)) ||
    (isObj(value) && Object.keys(value).some(key => graphContains(match, {[key]: value[key]})))
  return r
}

export const map = key => {
  key = key.toLowerCase().trim()
  return formulae.map[key] || null
}

export const toNum = str => {
  if (!isNaN(str)) return Number(str)
  const [n, d] = str.split('/')
  if (!isNaN(n) && !isNaN(d)) return n / d
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

export function parse (input) {
  const inputs = input.split(/[\s,]+/).map(k => k.toString().toLowerCase().trim()).filter(k => k)
  const keys = []
  let units = []
  let num = 1
  const op = inputs.reduce((op, key, i) => {
    if (map(key)) {
      units.push(map(key))
      return op
    }

    // Note: -ve not supported
    key = key.replace(/\d*([1..9]\/|[.])?\d+$/, m => { num = m; return '' })
             .replace(/^\d*([1..9]\/|[.])?\d+/, m => { num = m; return '' })

    if (key) {
      if ('x/*'.indexOf(key[0]) !== -1) {
        op = key[0]
        key = key.substr(1)
      }

      if (key) keys.push(key)
    }

    return (op === '*' ? 'x' : op)
  }, 'x')

  return [keys, toNum(num), op, units]
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
    return `${key} = ${value}${unit || ''}`
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

export function * generateList (graph, matches) {
  const keysInPath = contains(matches)
  const used = []
  for (let match of matches) {
    if (!used.includes(match)) {
      used.push(match)
      for (let path of generatePath(graph, match)) {
        if (keysInPath(path)) {
          yield path
        }
      }
    }
  }
}

const generator = (dataGraph, aliasGraph) => {
  const alias = aliasReducer(aliasGraph)
  return function * generate (input) {
    const [keys, num, op, to] = parse(input)
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
    for (let path of generateList(dataGraph, keys.length ? keys : to)) {
      const entryUnits = setUnits(path, to)
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
