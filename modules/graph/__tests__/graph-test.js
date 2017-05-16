import generator, { map, units, aliasReducer, calculate, convert, generatePath, generateList, contains, parse } from '../'
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
      broiled: 300
    },
    weight: {
      '1lb': 200
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

describe('graph', () => {
  describe('map', () => {
    it('translates key to value', () => {
      expect(map('f')).toBe('℉')
    })
    it('normalises translation', () => {
      expect(map('F ')).toBe('℉')
    })
  })

  describe('units', () => {
    it('should extract unit', () => {
      expect(units([{cups: foodGraph.cups}])).toBe('cup_ml')
    })
    it('should extract nested unit', () => {
      expect(units([
        {chicken: foodGraph.chicken},
        {fried: foodGraph.chicken.fried},
        {temp: foodGraph.chicken.fried.temp}
      ])).toBe('℃')
    })
    it('should extract nested keyed unit', () => {
      expect(units([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ])).toBe('℃')
    })
    it('should return unit conversion', () => {
      expect(units([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ], '℉')).toBe('℃_℉')
    })
    it('should default to last unit', () => {
      units([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ], '℉')
      expect(units([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ])).toBe('℃_℉')
    })
    it('should return redundant unit conversion', () => {
      expect(units([
        {beef: foodGraph.beef},
        {temp: foodGraph.beef.temp}
      ], '℃')).toBe('℃')
    })
    it('should not override explicit unit conversion', () => {
      expect(units([{cups: foodGraph.cups}], 'oz')).toBe('cup_ml')
    })
  })

  describe('conversions', () => {
    it('should populate formulae', () => {
      expect(convert['oz_gm'].gm).toBe(formulae['oz_gm'])
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
      expect(parse('a')).toEqual([['a'], 1, 'x', null, ['a']])
    })
    it('should return numbers', () => {
      expect(parse('a 123')).toEqual([['a'], 123, 'x', null, ['a', '123']])
    })
    it('should return ops', () => {
      expect(parse('a 123 /')).toEqual([['a'], 123, '/', null, ['a', '123', '/']])
    })
    it('should return unit', () => {
      expect(parse('a 123 f')).toEqual([['a'], 123, 'x', '℉', ['a', '123', 'f']])
    })
    it('should return unit, num', () => {
      expect(parse('a f 123')).toEqual([['a'], 123, 'x', '℉', ['a', 'f', '123']])
    })
    it('should return opnums', () => {
      expect(parse('a /123')).toEqual([['a'], 123, '/', null, ['a', '/123']])
    })
    it('should strip commas', () => {
      expect(parse('a, b')).toEqual([['a', 'b'], 1, 'x', null, ['a', 'b']])
    })
    it('should normlise ops', () => {
      expect(parse('a *123')).toEqual([['a'], 123, 'x', null, ['a', '*123']])
    })
    it('should disambiguate numbers', () => {
      expect(parse('a2', ['a'])).toEqual([['a'], 2, 'x', null, ['a2']])
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
      const value = calculate(foodGraph, null)
      expect(value).toEqual(
        'version = 0.0.1'
      )
    })
    it('should calculate units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, '℃')
      expect(value).toEqual(
        'broiled = 300.00℃'
      )
    })
    it('should convert units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, '℃_℉')
      expect(value).toEqual(
        'broiled = 572.00℉'
      )
    })
    it('should multiply units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, '℃', 2)
      expect(value).toEqual(
        'broiled x 2 = 600.00℃'
      )
    })
    it('should divide units', () => {
      const value = calculate({broiled: foodGraph.beef.temp.broiled}, '℃', 2, '/')
      expect(value).toEqual(
        'broiled / 2 = 150.00℃'
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
    it('should return calculated entry for number', () => {
      iter = generator(foodGraph, aliasGraph)('1/2')
      expect(iter.next().value).toEqual({
        type: 'branch', value: 'cups'
      })
      expect(iter.next().value).toEqual({
        type: 'node', value: '1/2 cup = 142.00ml'
      })
    })
    it('should return multiplied entry for number', () => {
      iter = generator(foodGraph, aliasGraph)('1/2 cup 2')
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'cups'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: '1/2 cup x 2 = 284.00ml'}
      )
    })
    it('should return divided entry for number', () => {
      iter = generator(foodGraph, aliasGraph)('1/2 cup /2')
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'cups'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: '1/2 cup / 2 = 71.00ml'}
      )
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
      expect(iter.next().value).toEqual({
        type: 'node',
        value: '1/2 cup = 142.00ml'
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
    it('should apply history', () => {
      const gen = generator(foodGraph, aliasGraph)
      iter = gen('cu')
      while (!iter.next().done);
      iter = gen('cu2')
      expect(iter.next().value).toEqual(
        {type: 'branch', value: 'cups'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: '1 cup x 2 = 568.00ml'}
      )
      expect(iter.next().value).toEqual(
        {type: 'node', value: '1/2 cup x 2 = 284.00ml'}
      )
    })
  })
})
