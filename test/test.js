import catalog from '../src/catalogger.js'
import { CACHE, CONFIG, DATA, INDEX, RESULTS, QUERY, NORMALIZE_STRING } from '../src/constants.js'
import { people, places, things } from './data/nouns.json'
import assert from 'assert'


describe('Catalogger', function () {
  describe('#NORMALIZE_STRING', function () {
    it('should return the string lower cased', function () {
      const c = catalog([])
      assert.equal(c[NORMALIZE_STRING]('sArCaSm CaSe'), 'sarcasm case')
    })

    it('should remove common articles, determiners, and extra spaces', function () {
      const c = catalog([])
      assert.equal(c[NORMALIZE_STRING](' Take the pen    to an island'), 'take pen island')
    })

    it('should cache normalizations', function () {
      const c = catalog([])
      const str = 'this is a cached result.'
      c[NORMALIZE_STRING](str)
      assert.equal(c[CACHE].stringNormalizations.get(str), 'this cached result')
    })

    it ('should use cached normalizations if found', function () {
      const c = catalog([])
      const str = 'hello, is this the crusty crab?'
      c[CACHE].stringNormalizations.set(str, 'no, this is patrick.')
      assert.equal(c[NORMALIZE_STRING](str), 'no, this is patrick.')
    })
  })

})
