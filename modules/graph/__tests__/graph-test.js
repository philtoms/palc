import generator, { map, setUnits, aliasReducer, calculate, convert, generatePath, generateList, contains, parse } from '../'
import formulae from '../formulae'

const foodGraph = {
  version: '0.0.1',
  beef: {
    unit: {
      temp: '℃',
      weight: 'mins'
    },
    temp: {
      int: 80,
      fried: 200,
      broiled: 300
    },
    weight: {
      'lb': 200
    }
  },
  chicken: {
    unit: '℃',
    fried: {
      temp: {
        oil: 340,
        int: 75
      }
    }
  },
  cups: {
    unit: 'cup_ml',
    '1 cup': 1
  },
  units: {
    unit: {
      oz: 'oz_gm'
    },
    oz: 1
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

describe('graph', () => {
  describe('map', () => {
    it('translates key to value', () => {
      expect(map('f')).toBe('℉')
    })
    it('normalises translation', () => {
      expect(map('F ')).toBe('℉')
    })
  })

  describe('setUnits', () => {
    it('should extract unit', () => {
      expect(setUnits([{cups: foodGraph.cups}])).toEqual(['cup', 'ml'])
    })
    it('should extract nested unit', () => {
      expect(setUnits([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
      ])).toEqual(['℃', '℃'])
    })
    it('should extract nested keyed unit', () => {
      expect(setUnits([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ])).toEqual(['℃', '℃'])
    })
    it('should extract parent keyed unit', () => {
      expect(setUnits([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp},
        {int: foodGraph.beef.temp.int}
      ])).toEqual(['℃', '℃'])
    })
    it('should return unit conversion', () => {
      expect(setUnits([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ], ['℉'])).toEqual(['℃', '℉'])
    })
    xit('should default to currrently selected unit', () => {
      calculate({broiled: foodGraph.beef.temp.broiled}, ['℃', '℉'])
      expect(setUnits([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ])).toEqual(['℃', '℉'])
    })
    it('should compose unit conversion', () => {
      expect(setUnits([{cups: foodGraph.cups}], ['floz'])).toEqual(['cup', 'ml', 'floz'])
    })
  })

  describe('conversions', () => {
    it('should populate formulae', () => {
      expect(convert['oz_gm'].gm).toBe(formulae.calc['oz_gm'])
    })
    it('should calculate inverse values for formula', () => {
      expect(convert['gm_oz'].oz(1).toFixed(4)).toBe('0.0353')
    })
    it('should link identity', () => {
      expect(convert.ml.ml(1)).toBe(1)
    })
    it('should link from -> to', () => {
      expect(convert.cup.ml(1)).toBe(284)
    })
    it('should link to -> from', () => {
      expect(convert.ml.cup(1).toFixed(4)).toBe('0.0035')
    })
  })

  describe('parse', () => {
    it('should return defaults', () => {
      expect(parse('a')).toEqual([['a'], 1, 'x', []])
    })
    it('should return numbers', () => {
      expect(parse('a 123')).toEqual([['a'], 123, 'x', []])
    })
    it('should return ops', () => {
      expect(parse('a 123 /')).toEqual([['a'], 123, '/', []])
    })
    it('should return unit', () => {
      expect(parse('a 123 f')).toEqual([['a'], 123, 'x', ['℉']])
    })
    it('should return unit, num', () => {
      expect(parse('a f 123')).toEqual([['a'], 123, 'x', ['℉']])
    })
    it('should return opnums', () => {
      expect(parse('a /123')).toEqual([['a'], 123, '/', []])
    })
    it('should strip commas', () => {
      expect(parse('a, b')).toEqual([['a', 'b'], 1, 'x', []])
    })
    it('should normlise ops', () => {
      expect(parse('a *123')).toEqual([['a'], 123, 'x', []])
    })
    it('should disambiguate trailing numbers', () => {
      expect(parse('a2')).toEqual([['a'], 2, 'x', []])
    })
    it('should disambiguate leading numbers', () => {
      expect(parse('2a')).toEqual([['a'], 2, 'x', []])
    })
    it('should ignore embedded numbers', () => {
      expect(parse('a2a')).toEqual([['a2a'], 1, 'x', []])
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

  describe('calculator', () => {
    it('should parse key value', () => {
      const value = calculate(foodGraph)
      expect(value).toEqual(
        'version = 0.0.1'
      )
    })
    it('should append units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, ['℃'])
      expect(value).toEqual(
        'broiled = 300℃'
      )
    })
    it('should multiply units (default op)', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, ['℃', '℃'], 2)
      expect(value).toEqual(
        'broiled x 2 = 600.00℃'
      )
    })
    it('should divide units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, ['℃', '℃'], 2, '/')
      expect(value).toEqual(
        'broiled / 2 = 150.00℃'
      )
    })
    it('should convert units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, ['℃', '℉'])
      expect(value).toEqual(
        'broiled = 572.00℉'
      )
    })
    it('should convert unit paths', () => {
      const value = calculate({cups: foodGraph.cups['1 cup']}, ['cup', 'ml', 'floz'])
      expect(value).toEqual(
        'cups = 10.00floz'
      )
    })
    it('should ignore false conversion', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, ['℃', 'x'])
      expect(value).toEqual(
        'broiled = 300.00℃'
      )
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
        {temp: foodGraph.beef.temp},
        {broiled: foodGraph.beef.temp.broiled}
      ])
    })
    it('should return multiple paths for shared key', () => {
      iter = generatePath(foodGraph, 'temp')
      expect(iter.next().value).toEqual([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ])
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
      ])
    })
    it('should return path for partial key', () => {
      iter = generatePath(foodGraph, 'v')
      expect(iter.next().value).toEqual([
        {version: foodGraph.version}
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
      iter = generateList(foodGraph, ['temp'])
      expect(iter.next().value).toEqual([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ])
      expect(iter.next().value).toEqual([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
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
      iter = generator(foodGraph, aliasGraph)('version')
      expect(iter.next().done).toBe(false)
      expect(iter.next().done).toBe(true)
    })
    it('should return entry', () => {
      iter = generator(foodGraph, aliasGraph)('version')
      expect(iter.next().value).toEqual({type: 'node', value: 'version = 0.0.1'})
    })
    it('should return done for trailing space entry', () => {
      iter = generator(foodGraph, aliasGraph)('version  ')
      expect(iter.next().done).toBe(false)
      expect(iter.next().done).toBe(true)
    })
    it('should calculate nodes for branch', () => {
      iter = generator(foodGraph, aliasGraph)('cups')
      expect(iter.next().value).toEqual({
        type: 'branch',
        value: 'cups'
      })
      expect(iter.next().value).toEqual({
        type: 'node',
        value: '1 cup = 284.00ml'
      })
    })
    it('should return calculated entry for number', () => {
      iter = generator(foodGraph, aliasGraph)('1/2 cups')
      expect(iter.next().value).toEqual({
        type: 'branch', value: 'cups'
      })
      expect(iter.next().value).toEqual({
        type: 'node', value: '1 cup x 0.5 = 142.00ml'
      })
    })
    it('should return aliased path values for branch', () => {
      iter = generator(foodGraph, aliasGraph)('chicken')
      expect(iter.next().value).toEqual({
        type: 'branch',
        value: 'chicken'
      })
      expect(iter.next().value).toEqual({
        type: 'node',
        value: 'fried chicken'
      })
    })
    it('should append default units', () => {
      const gen = generator(foodGraph, aliasGraph)
      iter = gen('b w')
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'beef, weight'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: 'lb = 200.00mins'}
      )
    })
    it('should apply conversion', () => {
      const gen = generator(foodGraph, aliasGraph)
      iter = gen('b t i f')
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'beef, temp'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: 'int = 176.00℉'}
      )
    })
    it('should list units', () => {
      const gen = generator(foodGraph, aliasGraph)
      iter = gen('oz')
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'units'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: 'oz = 28.35gm'}
      )
    })
  })
})
