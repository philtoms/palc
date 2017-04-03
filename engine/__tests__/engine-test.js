let foodGraph = {
  version: '0.0.1',
  beef: {
    int: 80,
    fried: {
      oil: 300
    }
  },
  chicken: {
    fried: {
      temp: {
        oil: 340,
        int: 75
      }
    }
  }
}
let aliasGraph = {
  chicken: {
    fried: 'fried chicken'
  },
  temp: {
    oil: 'oil temperature',
    int: 'internal temperature'
  }
}

const keyOf = obj => Object.keys(obj)[0]

const alias = path => {
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
    traverse(aliasGraph, keyOf(item))
    if (!parts.length && idx === path.length - 1) {
      parts.push(keyOf(item))
    }
  })

  return parts.join(' ')
}

let formulae = {
  oz_gm: x => x * 28.35
}

const inv = unit => x => x * (1 / (formulae[unit] || unit)(1))

function generateNode (graph, node, filter) {
  const traverse = function * (graph, path) {
    for (let key of Object.keys(graph)) {
      const value = graph[key]
      const newPath = path.concat({[key]: value})
      if (key.startsWith(node) && filter(newPath)) {
        yield newPath
      } else {
        if (!isNaN(node) && filter(newPath)) {
          yield path.concat({calc: Number(node)})
        } else if (typeof value === 'object') {
          yield * traverse(value, newPath)
        }
      }
    }
  }
  return traverse(graph, [])
}

function * generatePath (graph, nodes) {
  const pathFilter = filter(nodes)
  for (let node of nodes) {
    const it = generateNode(graph, node, pathFilter)
    for (let path = it.next(); !path.done; path = it.next()) {
      yield path.value
    }
  }
}

const filter = keys => path => keys.reduce((match, key) => {
  return match && (!!path.find(item => keyOf(item).startsWith(key)) || !isNaN(key))
}, true)

function nextFrame () {
  return new Promise(function (resolve, reject) {
    requestAnimationFrame(function () { resolve() })
  })
}

/* Applies `fn` to each element of `collection`, iterating once per frame */
nextFrame.mapInFrames = function (collection, fn) {
  var queue = Promise.resolve()
  var values = []
  collection.forEach(item => {
    queue = queue.then(() => nextFrame().then(() => values.push(fn(item))))
  })
  return queue.then(() => values)
}

// function generateItems (graph, keys) {
//   return nextFrame.mapInFrames(keys, key => {
//     const path = generateNode(graph, key)
//     while(path.next())
//   })
// }

describe('engine', () => {
  describe('formulae', () => {
    it('should calculate ivnverse values for key', () => {
      expect(inv('oz_gm')(1).toFixed(4)).toBe('0.0353')
    })
    it('should calculate ivnverse values for formula', () => {
      expect(inv(formulae.oz_gm)(1).toFixed(4)).toBe('0.0353')
    })
  })

  describe('generateNode', () => {
    const filter = () => true
    it('should return generator bound to graph', () => {
      expect(generateNode(foodGraph, 'version', filter).next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return item for branch key', () => {
      expect(generateNode(foodGraph, 'chicken', filter).next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return empty items for missing key', () => {
      expect(generateNode(foodGraph, 'xxx', filter).next().value).toEqual(undefined)
    })
    it('should return empty items for filtered key', () => {
      const filter = () => false
      expect(generateNode(foodGraph, 'chicken', filter).next().value).toEqual(undefined)
    })
    it('should return item for partial branch key', () => {
      expect(generateNode(foodGraph, 'chick', filter).next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return multiple items for shared key', () => {
      const items = generateNode(foodGraph, 'fried', filter)
      expect(items.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])
      expect(items.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
      expect(items.next().done).toBe(true)
    })
    it('should return item for partial key', () => {
      expect(generateNode(foodGraph, 'v', filter).next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return multiple items for partial key', () => {
      const items = generateNode(foodGraph, 'oi', filter)
      expect(items.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried},
        {oil: 300}
      ])
      expect(items.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp},
        {oil: 340}
      ])
    })
    it('should generate calc entry', () => {
      expect(generateNode(foodGraph, '123', filter).next().value).toEqual([
        {calc: 123}
      ])
    })
  })

  describe('filter', () => {
    const path = [
      {chicken: foodGraph.chicken},
      {fried: foodGraph.chicken.fried}
    ]

    it('should return true for matched path', () => {
      expect(filter(['chicken', 'fried'])(path)).toBe(true)
    })
    it('should return true for matched path with partial keys', () => {
      expect(filter(['chicken', 'f'])(path)).toBe(true)
    })
    it('should return true for reverse path', () => {
      expect(filter(['fried', 'chicken'])(path)).toBe(true)
    })
    it('should return true for partial path', () => {
      expect(filter(['chicken'])(path)).toBe(true)
    })
    it('should return true for numbers', () => {
      expect(filter(['chicken', 123])(path)).toBe(true)
    })
    it('should return false for unmatched path', () => {
      expect(filter(['fried', 'eggs'])(path)).toBe(false)
    })
  })

  describe('generatePath', () => {
    it('should return entries for each path key', () => {
      const path = generatePath(foodGraph, ['chicken', 'fried'])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
    })
    it('should return multiple entries for shared keys', () => {
      const path = generatePath(foodGraph, ['fried'])
      expect(path.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
    })

    it('should include calc entry in path', () => {
      const path = generatePath(foodGraph, ['chicken', '123'])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
      expect(path.next().value).toEqual([
        {calc: 123}
      ])
      expect(path.next().done).toBe(true)
    })
  })

  describe('alias', () => {
    it('should map to alias text', () => {
      expect(alias([
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried}
      ])).toBe('fried chicken')
    })
    it('should partial map to alias text', () => {
      expect(alias([
          {fried: foodGraph.chicken.fried}
      ])).toBe('fried chicken')
    })
    it('should substitute missing alias leaf text', () => {
      expect(alias([
          {chicken: foodGraph.chicken}
      ])).toBe('chicken')
    })
  })
})
