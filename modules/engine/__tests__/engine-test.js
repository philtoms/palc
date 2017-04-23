import generator, { aliasReducer, inv, formulae, generatePath, generateList, contains } from '../'

let foodGraph = {
  version: '0.0.1',
  beef: {
    int: {
      temp: {
        value: 80,
        unit: 'cel'
      }
    },
    fried: {
      oil: 300
    },
    broiled: {
      temp: 200
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

describe('engine', () => {
  describe('formulae', () => {
    it('should calculate ivnverse values for key', () => {
      expect(inv('oz_gm')(1).toFixed(4)).toBe('0.0353')
    })
    it('should calculate ivnverse values for formula', () => {
      expect(inv(formulae.oz_gm)(1).toFixed(4)).toBe('0.0353')
    })
  })

  describe('contains', () => {
    const path = [
      {chicken: foodGraph.chicken},
      {fried: foodGraph.chicken.fried}
    ]

    it('should return true for matched path', () => {
      expect(contains(['chicken', 'fried'])(path)).toBe(true)
    })
    it('should return true for matched path with partial keys', () => {
      expect(contains(['chicken', 'f'])(path)).toBe(true)
    })
    it('should return true for reverse path', () => {
      expect(contains(['fried', 'chicken'])(path)).toBe(true)
    })
    it('should return true for partial path', () => {
      expect(contains(['chicken'])(path)).toBe(true)
    })
    it('should return false for unmatched path', () => {
      expect(contains(['fried', 'eggs'])(path)).toBe(false)
    })
  })

  describe('aliasReducer', () => {
    let alias
    beforeEach(() => {
      alias = aliasReducer(aliasGraph)
    })

    it('should map to alias text', () => {
      expect(alias([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])).toBe('fried chicken')
    })
    it('should partial map to alias text', () => {
      expect(alias([
        {chicken: foodGraph.chicken},
        {poached: foodGraph.chicken.fried}
      ])).toBe('chicken poached')
    })
    it('should partial map branch text', () => {
      expect(alias([
        {chicken: foodGraph.chicken}
      ])).toBe('chicken')
    })
    it('should multi map to alias text', () => {
      expect(alias([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp},
        {oil: 340}
      ])).toBe('fried chicken oil temperature')
    })
    it('should substitute missing alias leaf text', () => {
      expect(alias([
        {beef: foodGraph.beef}
      ])).toBe('beef')
    })
    it('should substitute missing alias leaf text', () => {
      expect(alias([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])).toBe('beef fried')
    })
  })

  describe('generatePath', () => {
    const filter = () => true
    it('should return iterator bound to graph', () => {
      const it = generatePath(foodGraph, 'version', filter)
      expect(it.next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return path for branch key', () => {
      expect(generatePath(foodGraph, 'chicken', filter).next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return empty path for missing key', () => {
      expect(generatePath(foodGraph, 'xxx', filter).next().value).toEqual(undefined)
    })
    it('should return path for partial branch key', () => {
      expect(generatePath(foodGraph, 'chick', filter).next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return full path for nested key', () => {
      expect(generatePath(foodGraph, 'broiled', filter).next().value).toEqual([
        {beef: foodGraph.beef},
        {broiled: foodGraph.beef.broiled}
      ])
    })
    it('should return multiple paths for shared key', () => {
      const paths = generatePath(foodGraph, 'fried', filter)
      expect(paths.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])
      expect(paths.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
      expect(paths.next().done).toBe(true)
    })
    it('should return path for partial key', () => {
      expect(generatePath(foodGraph, 'v', filter).next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return multiple paths for shared partial key', () => {
      const paths = generatePath(foodGraph, 'oi', filter)
      expect(paths.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried},
        {oil: 300}
      ])
      expect(paths.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp},
        {oil: 340}
      ])
    })
  })

  describe('generateList', () => {
    it('should return entries for each path key', () => {
      const path = generateList(foodGraph, ['chicken', 'fried'])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
      ])
    })
    it('should return multiple entries for shared keys', () => {
      const path = generateList(foodGraph, ['fried'])
      expect(path.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried},
        {oil: foodGraph.beef.fried.oil}
      ])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
      ])
    })
    it('should return all child paths', () => {
      const path = generateList(foodGraph, ['chicken', 'fried', 'temp'])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp},
        {oil: foodGraph.chicken.fried.temp.oil}
      ])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp},
        {int: foodGraph.chicken.fried.temp.int}
      ])
    })

    it('should return empty list for unknown keys', () => {
      const path = generateList(foodGraph, ['xxx'])
      expect(path.next().done).toBe(true)
    })

    it('should return done for trailing space entry', () => {
      const path = generateList(foodGraph, ['c', ' '])
      path.next()
      expect(path.next().done).toBe(true)
    })

    it('should return calculated list for number entry', () => {
      const path = generateList(foodGraph, ['c', 123])
      path.next()
      expect(path.next().done).toBe(true)
    })
  })

  describe('generator', () => {
    it('should return path iteration', () => {
      const path = generator(foodGraph)(['c', 'chicken'])
      path.next()
      expect(path.next().done).toBe(true)
    })
  })
})
