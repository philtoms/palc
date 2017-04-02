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
    Object.keys(graph).forEach(akey => {
      if (typeof graph[akey] !== 'object') {
        if (key === akey) {
          parts.push(graph[akey])
        }
      } else {
        found = found || traverse(graph[akey], key)
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

const findKey = (graph, key) => {
  const accum = []
  const traverse = (graph, path) => {
    if (graph[key]) {
      accum.push(path.concat({[key]: graph[key]}))
    } else {
      const nk = Object.keys(graph).find(gk => gk.startsWith(key))
      if (nk) {
        accum.push(path.concat({[nk]: graph[nk]}))
      } else {
        Object.keys(graph)
        .filter(gk => typeof graph[gk] !== 'object' && gk.startsWith(key))
        .forEach(gk => {
          accum.push(path.concat({[gk]: graph[gk]}))
        })
        Object.keys(graph)
        .filter(gk => typeof graph[gk] === 'object')
        .forEach(gk => {
          const children = traverse(graph[gk], path.concat({[gk]: graph[gk]}))
          if (children) {
            accum.push(children)
          }
        })
      }
    }
  }
  traverse(graph, [])
  return accum.length ? accum : []
}

const findPath = (graph, keys) => {
  const fpath = []
  keys
    .map(key => findKey(graph, key))
    .filter(path => path.length)
    .forEach(path => {
      for (let p = 0; p < path.length; p++) {
        let match = 0
        for (let i = 0; i < keys.length; i++) {
          if (path[p].find(item => item[keys[i]] || keyOf(item).startsWith(keys[i]))) {
            match++
          }
        }
        if (match === keys.length) fpath.push(path[p])
      }
    })
  return fpath
}

describe('engine', () => {
  describe('formulae', () => {
    it('should calculate ivnverse values for key', () => {
      expect(inv('oz_gm')(1).toFixed(4)).toBe('0.0353')
    })
    it('should calculate ivnverse values for formula', () => {
      expect(inv(formulae.oz_gm)(1).toFixed(4)).toBe('0.0353')
    })
  })

  describe('findKey', () => {
    it('should return item for leaf key', () => {
      expect(findKey(foodGraph, 'version')).toEqual([
        [{version: foodGraph.version}]
      ])
    })
    it('should return item for branch key', () => {
      expect(findKey(foodGraph, 'chicken')).toEqual([
        [
          {chicken: foodGraph.chicken}
        ]
      ])
    })
    it('should return item for partial branch key', () => {
      expect(findKey(foodGraph, 'chick')).toEqual([
        [
          {chicken: foodGraph.chicken}
        ]
      ])
    })
    it('should return empty items for missing key', () => {
      expect(findKey(foodGraph, 'xxx')).toEqual([])
    })
    it('should return multiple items for shared key', () => {
      expect(findKey(foodGraph, 'fried')).toEqual([
        [
          {beef: foodGraph.beef},
          {fried: foodGraph.beef.fried}
        ],
        [
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried}
        ]
      ])
    })
    it('should return item for partial key', () => {
      expect(findKey(foodGraph, 'v')).toEqual([
        [{version: foodGraph.version}]
      ])
    })
    it('should return multiple items for partial key', () => {
      expect(findKey(foodGraph, 'oi')).toEqual([
        [
          {beef: foodGraph.beef},
          {fried: foodGraph.beef.fried},
          {oil: 300}
        ],
        [
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried},
          {temp: foodGraph.chicken.fried.temp},
          {oil: 340}
        ]
      ])
    })
  })

  describe('findPath', () => {
    it('should return empty set', () => {
      expect(findPath(foodGraph, ['xxx', 'fried'])).toEqual([])
    })
    it('should return single filtered entry for unique key', () => {
      expect(findPath(foodGraph, ['chicken', 'fried'])).toEqual([
        [
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried}
        ]
      ])
    })
    it('should return single filtered entry for unique partial key', () => {
      expect(findPath(foodGraph, ['chicken', 'f'])).toEqual([
        [
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried}
        ]
      ])
    })
    it('should return multiple filtered entries for shared keys', () => {
      expect(findPath(foodGraph, ['fried'])).toEqual([
        [
          {beef: foodGraph.beef},
          {fried: foodGraph.beef.fried}
        ],
        [
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried}
        ]
      ])
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
