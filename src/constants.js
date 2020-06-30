import REGULAR_EXPRESSIONS from './regular-expressions'

// dictionary property symbols
export const LENGTH = Symbol('catalogger_length')
export const OCCURENCES = Symbol('catalogger_occurences')
export const RELEVANCE = Symbol('catalogger_relevance')
export const WEIGHT = Symbol('catalogger_weight')

// private method symbols
export const BUILD_INDEX = Symbol('catalogger_buildIndex')
export const GET_RESULTS = Symbol('catalogger_getResults')
export const INVALIDATE_RESULTS = Symbol('catalogger_invalidateResults')
export const INVALIDATE_SORTING = Symbol('catalogger_invalidateSorting')
export const NORMALIZE_STRING = Symbol('catalogger_normalizeString')
export const UPDATE_RESULTS = Symbol('catalogger_updateResults')

// private property symbols
export const CACHE = Symbol('catalogger_cache')
export const CONFIG = Symbol('catalogger_config')
export const DATA = Symbol('catalogger_data')
export const INDEX = Symbol('catalogger_index')
export const RESULTS = Symbol('catalogger_results')
export const QUERY = Symbol('catalogger_query')

export const DEFAULT_CONFIG = {
  relevance: { inject: false, field: RELEVANCE, threshold: -1 },
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

export { REGULAR_EXPRESSIONS }
