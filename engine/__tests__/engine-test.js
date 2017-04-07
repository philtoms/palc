import generateList, { alias, inv, formulae, generateNode, generatePath, filter } from '../'

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
        {fried: foodGraph.beef.fried},
        {beef: foodGraph.beef}
      ])
      expect(items.next().value).toEqual([
        {fried: foodGraph.chicken.fried},
        {chicken: foodGraph.chicken}
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
        {oil: 300},
        {fried: foodGraph.beef.fried},
        {beef: foodGraph.beef}
      ])
      expect(items.next().value).toEqual([
        {oil: 340},
        {temp: foodGraph.chicken.fried.temp},
        {fried: foodGraph.chicken.fried},
        {chicken: foodGraph.chicken}
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
    it('should return false for unmatched path', () => {
      expect(filter(['fried', 'eggs'])(path)).toBe(false)
    })
  })

  describe('alias', () => {
    it('should map to alias text', () => {
      expect(alias(aliasGraph, [
          {chicken: foodGraph.chicken},
          {fried: foodGraph.chicken.fried}
      ])).toBe('fried chicken')
    })
    it('should partial map to alias text', () => {
      expect(alias(aliasGraph, [
          {fried: foodGraph.chicken.fried}
      ])).toBe('fried chicken')
    })
    it('should substitute missing alias leaf text', () => {
      expect(alias(aliasGraph, [
          {chicken: foodGraph.chicken}
      ])).toBe('chicken')
    })
  })

  describe('generatePath', () => {
    it('should return entries for each path key', () => {
      const path = generatePath(foodGraph, ['chicken', 'fried'])
      expect(path.next().value).toEqual([
        {fried: foodGraph.chicken.fried},
        {chicken: foodGraph.chicken}
      ])
    })
    it('should return multiple entries for shared keys', () => {
      const path = generatePath(foodGraph, ['fried'])
      expect(path.next().value).toEqual([
        {fried: foodGraph.beef.fried},
        {beef: foodGraph.beef}
      ])
      expect(path.next().value).toEqual([
        {fried: foodGraph.chicken.fried},
        {chicken: foodGraph.chicken}
      ])
    })

    it('should return empty list for unknown keys', () => {
      const path = generatePath(foodGraph, ['xxx'])
      expect(path.next().done).toBe(true)
    })

    it('should return done for trailing space entry', () => {
      const path = generatePath(foodGraph, ['c', ' '])
      path.next()
      expect(path.next().done).toBe(true)
    })
  })

  describe('generateList', () => {
    it('should filter duplicates', () => {
      const path = generateList(foodGraph, aliasGraph)(['c', 'chicken'])
      path.next()
      expect(path.next().done).toBe(true)
    })
  })
})
