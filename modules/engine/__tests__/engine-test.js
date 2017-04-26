import generator, { aliasReducer, inv, formulae, generatePath, generateList, contains } from '../'

const foodGraph = {
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
  },
  cups: {
    units: {
      ml: {swap: 237}
    },
    '1 cup': {calc: 1},
    '1/2 cup': {calc: 1 / 2}
  }
}

const aliasGraph = {
  chicken: {
    fried: 'fried chicken'
  },
  temp: {
    oil: 'oil temperature',
    int: 'internal temperature'
  },
  cups: {
    units: '1 cup ='
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
    it('should substitute missing alias text', () => {
      expect(alias([
        {beef: foodGraph.beef}
      ])).toBe('beef')
    })
    it('should substitute missing alias path text', () => {
      expect(alias([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])).toBe('beef fried')
    })
  })

  describe('generatePath', () => {
    it('should return iterator bound to graph', () => {
      const it = generatePath(foodGraph, 'version')
      expect(it.next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return path for branch key', () => {
      expect(generatePath(foodGraph, 'chicken').next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return empty path for missing key', () => {
      expect(generatePath(foodGraph, 'xxx').next().value).toEqual(undefined)
    })
    it('should return path for partial branch key', () => {
      expect(generatePath(foodGraph, 'chick').next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return full path for nested key', () => {
      expect(generatePath(foodGraph, 'broiled').next().value).toEqual([
        {beef: foodGraph.beef},
        {broiled: foodGraph.beef.broiled}
      ])
    })
    it('should return multiple paths for shared key', () => {
      const paths = generatePath(foodGraph, 'fried')
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
      expect(generatePath(foodGraph, 'v').next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return multiple paths for shared partial key', () => {
      const paths = generatePath(foodGraph, 'oi')
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
        {fried: foodGraph.chicken.fried}
      ])
    })
    it('should return multiple entries for shared keys', () => {
      const path = generateList(foodGraph, ['fried'])
      expect(path.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])
      expect(path.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried},
        {oil: foodGraph.beef.fried.oil}
      ])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
      expect(path.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
      ])
    })

    it('should return empty list for unknown keys', () => {
      const path = generateList(foodGraph, ['xxx'])
      expect(path.next().done).toBe(true)
    })

    it('should return done for trailing space entry', () => {
      const path = generateList(foodGraph, ['version', ' '])
      expect(path.next().done).toBe(false)
      expect(path.next().done).toBe(true)
    })

    it('should return calculated entry for number', () => {
      const path = generateList(foodGraph, ['1/2 cup', 2])
      expect(path.next().value).toEqual([
        {cups: foodGraph.cups}
      ])
      expect(path.next().value).toEqual([
        {'1/2 cup': '237.00ml'}
      ])
    })
  })

  describe('generator', () => {
    it('should return path iteration', () => {
      const path = generator(foodGraph, aliasGraph)(['version'])
      expect(path.next().done).toBe(false)
      expect(path.next().done).toBe(true)
    })
    it('should return aliased path values for branch', () => {
      const path = generator(foodGraph, aliasGraph)(['chicken'])
      expect(path.next().value).toEqual({
        type: 'branch',
        value: 'chicken'
      })
      expect(path.next().value).toEqual({
        type: 'branch',
        value: 'fried chicken'
      })
    })
    it('should return aliased path values for node', () => {
      const path = generator(foodGraph, aliasGraph)(['1/2'])
      expect(path.next().value).toEqual({
        type: 'branch',
        value: 'cups'
      })
      expect(path.next().value).toEqual({
        type: 'node',
        value: '1/2 cup = 118.50ml'
      })
    })
  })
})
