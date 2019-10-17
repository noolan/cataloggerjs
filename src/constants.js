import REGULAR_EXPRESSIONS from './regular-expressions'
export { REGULAR_EXPRESSIONS }

export const DEFAULT_CONFIG = {
  relevance: { inject: false, field: '_relevance', threshold: -1 },
  results: { limit: -1 },
  sort: { byRelevance: true, enabled: true, fields: null },
  string: {
    replacements: [
      { exp: REGULAR_EXPRESSIONS.singleCharacters, val: '' },
      { exp: REGULAR_EXPRESSIONS.punctuation, val: ' ', grouped: true },
      { exp: REGULAR_EXPRESSIONS.articlesAndDeterminers, val: ' ' },
      { exp: REGULAR_EXPRESSIONS.tabsAndVerticalWhitespace, val: ' ' },
      { exp: REGULAR_EXPRESSIONS.multiSpace, val: ' ' }
    ]
  }
}

// dictionary property symbols
export const LENGTH = Symbol('length')
export const OCCURENCES = Symbol('occurences')
export const RELEVANCE = Symbol('relevance')
export const WEIGHT = Symbol('weight')

// private method symbols
export const BUILD_INDEX = Symbol('buildIndex')
export const GET_RESULTS = Symbol('getResults')
export const INVALIDATE_RESULTS = Symbol('invalidateResults')
export const INVALIDATE_SORTING = Symbol('invalidateSorting')
export const NORMALIZE_STRING = Symbol('normalizeString')
export const UPDATE_RESULTS = Symbol('updateResults')

// private property symbols
export const CACHE = Symbol('cache')
export const CONFIG = Symbol('config')
export const DATA = Symbol('data')
export const INDEX = Symbol('index')
export const RESULTS = Symbol('results')
export const QUERY = Symbol('query')
