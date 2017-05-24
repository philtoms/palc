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
const units = {unit: {}}

export const setUnits = (path, to = [], keys = []) => {
  const entry = lastEntry(path)
  keys.push(keyOf(entry))
  let unit
  if (path.length) {
    unit = valueOf(entry).unit
    if (!unit) return setUnits(path.slice(0, -1), to, keys)
    if (isObj(unit)) {
      unit = keys.reduce((u, key) => (u = u || unit[key]), undefined)
    }
  }

  const units = (unit || '').split('_').concat(to).filter(u => u).reduce((a, u) => {
    a.push(u)
    // overrides[u] = overrides[u] || u
    // if (overrides[u] !== u) {
    //   a.push(overrides[u])
    // }
    return a
  }, [])

  if (units.length === 1) {
    units.push(units[0])
  }

  return units
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
  return formulae.map[key]
}

export const toNum = str => {
  if (!isNaN(str)) return Number(str)
  const [n, d] = str.split('/')
  if (!isNaN(n) && !isNaN(d)) return n / d
}

export const convert = (({calc}) => {
  const id = x => x
  const conv = Object.keys(calc).reduce((obj, key) => {
    const [from, to] = key.split('_')
    const inv = `${to}_${from}`
    obj[key] = {[to]: calc[key]}
    obj[from] = {...(obj[from] || {}), [from]: id, [to]: obj[key][to]}
    if (!calc[inv]) {
      obj[inv] = {[from]: x => x * (1 / calc[key](x))}
      obj[to] = {...(obj[to] || {}), [to]: id, [from]: obj[inv][from]}
    }
    units.unit[from] = key
    units.unit[to] = inv
    units[from] = 1
    units[to] = 1
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
    const unit = map(key) || key
    if (convert[unit]) {
      units.push(unit)
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

  // transfer unit only input to keys
  if (!keys.length && units.length) {
    keys.push(units.shift())
  }
  return [keys, toNum(num), op, units]
}

export const calculate = (entry, units = [], num = 1, op = 'x') => {
  const key = keyOf(entry)
  const value = valueOf(entry)

  if (isNum(value) && units.length > 1) {
    const calc = units.reduce((a, u) => {
      a.conv.push(u)
      const [from, to] = a.conv.slice(-2)
      if (convert[from] && convert[from][to]) {
        overrides[from] = to
        a.value = convert[from][to](a.value)
        a.unit = to
      }
      return a
    }, {value, conv: [], unit: units[0]})
    let calculated
    switch (op) {
      case '/':
        calculated = calc.value / num
        break
      default:
        calculated = calc.value * num
        break
    }
    return `${value === 1 ? '1 ' : ''}${key}${num !== 1 ? ` ${op} ${num}` : ''} = ${swap(calc.unit, calculated.toFixed(2))}`
  }
  return `${key} = ${value}${units[0] || ''}`
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
  dataGraph.units = units

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
    for (let path of generateList(dataGraph, keys)) {
      yield * generateEntry(path, setUnits(path, to))
      if (isBranch(path)) {
        const nodes = valueOf(lastEntry(path))
        for (let key of filter(nodes)) {
          const node = {[key]: nodes[key]}
          const entry = isNode(node) ? [node] : path.concat(node)
          yield * generateEntry(entry, setUnits(path.concat(node), to), true)
        }
      }
    }
  }
}

export default generator
