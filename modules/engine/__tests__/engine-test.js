import generator, { aliasReducer, inv, formulae, generatePath, generateList, contains } from '../'

const foodGraph = {
  version: '0.0.1',
  beef: {
    units: {
      c: 1
    },
    int: {
      temp: 80
    },
    fried: {
      oil: 300
    },
    broiled: {
      temp: 200
    }
  },
  chicken: {
    units: {
      c: 1
    },
    fried: {
      temp: {
        oil: 340,
        int: 75
      }
    }
  },
  cups: {
    units: {
      ml: 237
    },
    '1 cup': 1,
    '1/2 cup': 0.5
  }
}

const aliasGraph = {
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
      ])).toBe('chicken, poached')
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
      ])).toBe('fried chicken, oil temperature')
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
      ])).toBe('beef, fried')
    })
  })

  describe('generatePath', () => {
    let iter
    afterEach(() => {
      expect(iter.next().done).toBe(true)
    })
    it('should return iterator bound to graph', () => {
      iter = generatePath(foodGraph, 'version')
      expect(iter.next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return path for branch key', () => {
      iter = generatePath(foodGraph, 'chicken')
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return empty path for missing key', () => {
      iter = generatePath(foodGraph, 'xxx')
      expect(iter.next().value).toEqual(undefined)
    })
    it('should return path for partial branch key', () => {
      iter = generatePath(foodGraph, 'chick')
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return full path for nested key', () => {
      iter = generatePath(foodGraph, 'broiled')
      expect(iter.next().value).toEqual([
        {beef: foodGraph.beef},
        {broiled: foodGraph.beef.broiled}
      ])
    })
    it('should return multiple paths for shared key', () => {
      iter = generatePath(foodGraph, 'fried')
      expect(iter.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
      expect(iter.next().done).toBe(true)
    })
    it('should return path for partial key', () => {
      iter = generatePath(foodGraph, 'v')
      expect(iter.next().value).toEqual([
        {version: foodGraph.version}
      ])
    })
    it('should return multiple paths for shared partial key', () => {
      iter = generatePath(foodGraph, 'oi')
      expect(iter.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried},
        {oil: 300}
      ])
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp},
        {oil: 340}
      ])
    })
  })

  describe('generateList', () => {
    let iter
    afterEach(() => {
      expect(iter.next().done).toBe(true)
    })
    it('should return paths for each path key', () => {
      iter = generateList(foodGraph, ['chicken', 'fried'])
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
    })
    it('should return multiple paths for shared keys', () => {
      iter = generateList(foodGraph, ['fried'])
      // for (let p of path) {
      //   console.log(p)
      // }
      expect(iter.next().value).toEqual([
        {beef: foodGraph.beef},
        {fried: foodGraph.beef.fried}
      ])
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried}
      ])
    })

    it('should return empty list for unknown keys', () => {
      iter = generateList(foodGraph, ['xxx'])
      expect(iter.next().done).toBe(true)
    })
  })

  describe('generator', () => {
    let iter
    afterEach(() => {
      expect(iter.next().done).toBe(true)
    })
    it('should generate iteration', () => {
      iter = generator(foodGraph, aliasGraph)(['version'])
      expect(iter.next().done).toBe(false)
      expect(iter.next().done).toBe(true)
    })
    it('should return entry', () => {
      iter = generator(foodGraph, aliasGraph)(['version'])
      expect(iter.next().value).toEqual({type: 'node', value: 'version = 0.0.1'})
    })
    it('should return done for trailing space entry', () => {
      iter = generator(foodGraph, aliasGraph)(['version', ' '])
      expect(iter.next().done).toBe(false)
      expect(iter.next().done).toBe(true)
    })
    it('should return calculated entry for number', () => {
      iter = generator(foodGraph, aliasGraph)(['1/2'])
      expect(iter.next().value).toEqual({
        type: 'branch', value: 'cups'
      })
      expect(iter.next().value).toEqual({
        type: 'node', value: '1/2 cup = 118.50ml'
      })
    })
    it('should return multiplied entry for number', () => {
      iter = generator(foodGraph, aliasGraph)(['1/2 cup', 2])
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'cups'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: '1/2 cup = 237.00ml'}
      )
    })
    it('should calculate nodes for branch', () => {
      iter = generator(foodGraph, aliasGraph)(['cups'])
      expect(iter.next().value).toEqual({
        type: 'branch',
        value: 'cups'
      })
      expect(iter.next().value).toEqual({
        type: 'node',
        value: '1 cup = 237.00ml'
      })
      expect(iter.next().value).toEqual({
        type: 'node',
        value: '1/2 cup = 118.50ml'
      })
    })
    it('should return aliased path values for branch', () => {
      iter = generator(foodGraph, aliasGraph)(['chicken'])
      expect(iter.next().value).toEqual({
        type: 'branch',
        value: 'chicken'
      })
      expect(iter.next().value).toEqual({
        type: 'node',
        value: 'fried chicken'
      })
    })
  })
})
