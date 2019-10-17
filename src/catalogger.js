const levenshtein = require('js-levenshtein')
import { cloneEnumerable, getNestedValue, valueToArray, valueToString } from './utilities'
import {
  REGULAR_EXPRESSIONS, DEFAULT_CONFIG,
  LENGTH, OCCURENCES, RELEVANCE, WEIGHT,
  BUILD_INDEX, GET_RESULTS, INVALIDATE_RESULTS, INVALIDATE_SORTING, NORMALIZE_STRING, UPDATE_RESULTS,
  CACHE, CONFIG, DATA, INDEX, RESULTS, QUERY
} from './constants'

class Catalogger {

  constructor (documents, fields, options) {
    this[CACHE] = { stringNormalizations: new Map() }
    this[CONFIG] = { relevance: {}, results: {}, sort: {} }
    this[DATA] = { documents: [], fields: [], type: 'Array' }
    this[INDEX] = { dictionary: Object.create(null), valid: true }
    this[RESULTS] = { items: new Map(), sorted: true, valid: true }
    this[QUERY] = { processed: '', raw: '', tokens: [] }

    this.config = options
    this.documents = documents
    this.fields = fields
  }

  get config () { return cloneEnumerable(this[CONFIG]) }
  set config ({ relevance={}, results={}, sort={}, string={} } = { relevance:{}, results:{}, sort:{}, string:{} }) {
    const config = {
      relevance: { ...DEFAULT_CONFIG.relevance, ...this[CONFIG].relevance, ...relevance },
      results: { ...DEFAULT_CONFIG.results, ...this[CONFIG].results, ...results },
      sort: { ...DEFAULT_CONFIG.sort, ...this[CONFIG].sort, ...sort },
      string: { ...DEFAULT_CONFIG.string, ...this[CONFIG].string, ...string },
    }
    config.sort.fields = valueToArray(config.sort.fields, { removeEmpty: true, trimStrings: true })
    this[CONFIG] = config
    this.reIndex()
  }

  get documents () { return this[DATA].documents }
  set documents (documents) {
    if (documents !== this[DATA].documents) {
      if (typeof documents === 'undefined' || documents === 'null') {
        this[DATA].documents = []
      } else {
        this[DATA].documents = documents
      }
      if (Array.isArray(this[DATA].documents)) {
        this[DATA].type = 'Array'
      } else {
        this[DATA].type = 'Object'
      }
      this.reIndex()
    }
  }

  get fields () { return cloneEnumerable(this[DATA].fields) }
  set fields (rawFields) {
    const fields = valueToArray(rawFields, { removeEmpty: true, trimStrings: true })
    // no fields supplied so we use the fields from the first document
    if (fields.length === 0 && typeof this[DATA].documents === 'object') {
      const documents = Object.keys(this[DATA].documents)
      if (typeof this[DATA].documents[documents[0]] === 'object') {
        const documentFields = Object.keys(this[DATA].documents[documents[0]])
        for (const field of documentFields) {
          if (typeof this[DATA].documents[documents[0]][field] !== 'object') {
            fields.push(field)
          }
        }
      }
    }
    // check if fields have changed
    if (fields.length === this[DATA].fields.length) {
      let same = true
      for (let i = 0; i < fields.length; i++) {
        if (fields[i] !== this[DATA].fields[i]) {
          same = false
          break;
        }
      }
      if (same) {
        return undefined
      }
    }
    this[DATA].fields = fields
    this.reIndex()
  }

  get query () { return this[QUERY].raw }
  set query (rawQuery) {
    if (typeof rawQuery === 'string') {
      if (rawQuery !== this[QUERY].raw) {
        this[QUERY].raw = rawQuery
        const processed = this[NORMALIZE_STRING](rawQuery)
        if (processed !== this[QUERY].processed) {
          this[QUERY].processed = processed
          this[QUERY].tokens = [...new Set(processed.split(' '))] // remove duplicates
          this[INVALIDATE_RESULTS]()
        }
      }
    } else { // invalid rawQuery provided
      this[QUERY].processed = ''
      this[QUERY].raw = ''
      this[QUERY].tokens = []
    }
  }

  get indexed () { return this[INDEX].valid }
  get evaluated () { return this[RESULTS].valid }
  get sorted () { return this[RESULTS].sorted }

  reIndex () {
    this[INDEX].valid = false
    this[INVALIDATE_RESULTS]()
    this[BUILD_INDEX]()
    return this
  }

  resultsFor (query) {
    this.query = query
    return this[GET_RESULTS]()
  }

  *[Symbol.iterator] () {
    yield* this.result()
  }

  *result () {
    const results = this[GET_RESULTS]()
    for (const result of results) {
      yield result
    }
  }

  [BUILD_INDEX] () {
    if (!this[INDEX].valid) {
      if (this[DATA].documents !== null && typeof this[DATA].documents === 'object' && Array.isArray(this[DATA].fields)) {
        const keys = Object.keys(this[DATA].documents)
        this[INDEX].dictionary = Object.create(null)
        const dict = this[INDEX].dictionary

        for (const key of keys) {

          for (const field of this[DATA].fields) {
            let value = ''

            if (field.includes('.')) {
              value = getNestedValue(this[DATA].documents[key], field, { keySeparator: '.' })
            } else {
              value = this[DATA].documents[key][field]
            }
            const rawText = valueToString(value, { glue: ' '}).toLowerCase().trim()
            if (rawText !== '') {
              const normalizedText = this[NORMALIZE_STRING](rawText)
              const tokens = normalizedText.split(' ')
              let tokenIndex = 0

              for (const token of tokens) {
                if (typeof dict[token] === 'undefined') {
                  
                  dict[token] = Object.create(null)
                  dict[token][LENGTH] = token.length
                  dict[token][OCCURENCES] = 0
                }

                if (typeof dict[token][key] === 'undefined') {
                  dict[token][key] = Object.create(null)
                  dict[token][key][OCCURENCES] = 0
                }

                if (typeof dict[token][key][field] === 'undefined') {
                  dict[token][key][field] = Object.create(null)
                  dict[token][key][field].fieldLength = rawText.length
                  dict[token][key][field].foundAt = []
                  dict[token][key][field][OCCURENCES] = 0
                }

                dict[token][OCCURENCES]++
                dict[token][key][OCCURENCES]++
                dict[token][key][field][OCCURENCES]++

                dict[token][key][field].foundAt.push(tokenIndex)

                tokenIndex++
              } // end loop over field tokens
            } // end if field is empty
          } // end loop over searchable fields
        
        } // end loop over document keys
        
        // calculate dictionary entry weights
        for (const token of Object.keys(dict)) {
          dict[token][WEIGHT] = 1 / (Math.log(dict[token][OCCURENCES]) + 1)
          for (const key of Object.keys(dict[token])) {
            let docWeight = 0
            for (const field of Object.keys(dict[token][key])) {
              docWeight += 1 / (Math.log(dict[token][key][field].fieldLength) + 1)
            }
            dict[token][key][WEIGHT] = docWeight / dict[token][key][OCCURENCES]
          }
        }

      } // end if documents usable

      this[INDEX].valid = true
    }
    return this
  }

  [GET_RESULTS] () {
    this[UPDATE_RESULTS]()

    const docs = this[DATA].documents
    const items = this[RESULTS].items
    const threshold = this[QUERY].processed === '' ? -1 : this[CONFIG].relevance.threshold

    let limit = this[CONFIG].results.limit
    const resultDocuments = new Map()

    // choosing to duplicate code so there are fewer comparisons inside the loop
    if (limit === -1) { // unlimited
      if (threshold === -1) { // all results
        for (const key of items.keys()) {
          resultDocuments.set(key, docs[key])
        }
      } else { // results that exceed threshold
        if (this[CONFIG].sort.enabled) { // items are sorted so we can stop when the threshold is reached
          for (const item of items.entries()) {
            if (item[1] >= threshold) {
              resultDocuments.set(item[0], docs[item[0]])
            } else {
              break
            }
          }
        } else { // items are unsorted so we have to loop through all of them
          for (const item of items.entries()) {
            if (item[1] >= threshold) {
              resultDocuments.set(item[0], docs[item[0]])
            }
          }
        }
      }
    } else { // limited
      if (threshold === -1) { // all results
        for (const key of items.keys()) {
          if (limit > 0) {
            resultDocuments.set(key ,docs[key])
            limit--
          } else {
            break
          }
        }
      } else { // results that exceed threshold
        if (this[CONFIG].sort.enabled) { // items are sorted so we can stop when the limit or threshold is reached
          for (const item of items.entries()) {
            if (item[1] >= threshold && limit > 0) {
              resultDocuments.set(item[0], docs[item[0]])
              limit--
            } else {
              break
            }
          }
        } else { // items are unsorted so we have to loop through them until the limit is reached
          for (const item of items.entries()) {
            if (item[1] >= threshold && limit > 0) {
              resultDocuments.set(item[0], docs[item[0]])
              limit--
            } else if (limit < 1) {
              break
            }
          }
        }
      }
    }

    if (this[DATA].type === 'Array') {
      return Array.from(resultDocuments.values())
    } else {
      const output = Object.create(null)
      for (const doc of resultDocuments.entries()) {
        output[doc[0]] = doc[1]
      }
      return output
    }
  }

  [INVALIDATE_RESULTS] () {
    this[RESULTS].items.clear()
    this[INVALIDATE_SORTING]()
    this[RESULTS].valid = false
    return this
  }

  [INVALIDATE_SORTING] () {
    this[RESULTS].sorted = false
    return this
  }

  [NORMALIZE_STRING] (input) {
    let normalizedString = ''
    const str = input.toLowerCase().trim()

    if (this[CACHE].stringNormalizations.has(str)) {
      normalizedString = this[CACHE].stringNormalizations.get(str)
    } else {
      normalizedString = str
      
      for (const replacement of this[CONFIG].string.replacements) {
        if (replacement.grouped) {
          let match = []
          while ((match = replacement.exp.exec(normalizedString)) !== null) {
            if (match.length === 1 || typeof match[1] === 'undefined') {
              normalizedString = normalizedString.substring(0, match.index) + replacement.val + normalizedString.substring(match.index + match[0].length)
            } else {
              let start = normalizedString.substring(0, match.index)
              let middle = normalizedString.substring(match.index, match.index + match[0].length)
              let end = normalizedString.substring(match.index + match[0].length)

              for (let i = 1; i < match.length; i++) {
                if (typeof match[i] !== 'undefined') {
                  middle = middle.replace(match[i], replacement.val)
                }
              }
              normalizedString = start + middle + end
            }
          }
        } else {
          normalizedString = normalizedString.replace(replacement.exp, replacement.val)
        }
      }
      // remove any leading or trailing spaces left from the replacements
      normalizedString = normalizedString.trim()

      // store the result in the cache
      this[CACHE].stringNormalizations.set(str, normalizedString)
    }
    return normalizedString
  }

  [UPDATE_RESULTS] () {
    if (!this[INDEX].valid) {
      this[BUILD_INDEX]()
    }
    if (!this[RESULTS].valid) {
      this[INVALIDATE_SORTING]()
      this[RESULTS].items = new Map(Object.keys(this[DATA].documents).map(k => [k, 0]))
      const results = this[RESULTS].items
      const dict = this[INDEX].dictionary
      const dictTokens = Object.keys(dict)

      for (const queryToken of this[QUERY].tokens) {
        if (typeof dict[queryToken] !== 'undefined') {
          for (const key of Object.keys(dict[queryToken])) {
            let relevance = results.get(key)
            relevance += dict[queryToken][WEIGHT] * dict[queryToken][key][WEIGHT]
            results.set(key, relevance)
          }
        }
        
        for (const dictToken of dictTokens) {
          let matchValue = 0
          if ((queryToken.length > dictToken.length) ? queryToken.includes(dictToken) : dictToken.includes(queryToken)) {
            matchValue = Math.min(queryToken.length, dictToken.length) * 0.1
          } else {
            const distance = levenshtein(queryToken, dictToken)
            if (distance < 6) {
              matchValue = (5 - distance) * 0.01
            }
          }

          if (matchValue > 0) {
            for (const key of Object.keys(dict[dictToken])) {
              let relevance = results.get(key)
              relevance += dict[dictToken][WEIGHT] * dict[dictToken][key][WEIGHT] * matchValue
              results.set(key, relevance)
            }
          }
        }
      }

      if (this[CONFIG].relevance.inject) {
        if (this[QUERY].processed === '') {
          for (const result of results.entries()) {
            this[DATA].documents[result[0]][this[CONFIG].relevance.field] = 0
          }
        } else {
          for (const result of results.entries()) {
            this[DATA].documents[result[0]][this[CONFIG].relevance.field] = result[1]
          }
        }
      }
      this[RESULTS].valid = true
    }

    if (!this[RESULTS].sorted) {
      if (this[CONFIG].sort.enabled) {
        let results = Array.from(this[RESULTS].items.entries())
        if (Array.isArray(this[CONFIG].sort.fields) && this[CONFIG].sort.fields.length) {
          const collator = new Intl.Collator(
            undefined,
            {
              caseFirst: 'false',
              ignorePunctuation: false,
              localeMatcher: 'best fit',
              numeric: true,
              sensitivity: 'base',
              usage: 'sort'
            }
          )

          results.sort((a, b) => {
            const docA = this[DATA].documents[a[0]]
            const docB = this[DATA].documents[b[0]]
            let comparison = 0
            for (const field of this[CONFIG].sort.fields) {
              comparison = collator.compare(docA[field], docB[field])
              if (comparison) {
                return comparison
              }
            }
            return comparison
          })
        }
        if (this[CONFIG].sort.byRelevance) {
          results.sort((a, b) => b[1] - a[1])
        }
        this[RESULTS].items = new Map(results)
      }
      this[RESULTS].sorted = true
    }
    return this
  }
}

/**
 * Factory function to instantiate and configure a Catalog object
 * 
 * @param  { [Object] } documents
 * @param  { Object }   options
 * @param  { Object }   options.relevance
 * @param  { Boolean }  options.relevance.inject    [ false ]
 * @param  { String }   options.relevance.field     [ '_relevance' ]
 * @param  { Number }   options.relevance.threshold [ -1 ]
 * @param  { Object }   options.results
 * @param  { Number }   options.results.limit       [ -1 ]
 * @param  { Object }   options.sort
 * @param  { Boolean }  options.sort.byRelevance    [ true ]
 * @param  { Boolean }  options.sort.enabled        [ true ]
 * @param  { Boolean }  options.sort.fields         [ null ]
 * @param  { Object }   options.string
 * @param  { [Object] } options.string.replacements [ [{}] ]
 * @param  { [String] } using                       [ [] ]
 * @return { Catalog }
 */
const catalog = function (
  documents,
  {
    relevance = {}, results = {}, sort = {}, string = {}, using = []
  } = {
    relevance: {}, results: {}, sort: {}, string: {}, using: []
  }
) {
  return new Catalogger(documents, using, { relevance, results, sort, string })
}

const replacements = DEFAULT_CONFIG.string.replacements

export {
  catalog as default,
  DEFAULT_CONFIG as config,
  REGULAR_EXPRESSIONS as expressions,
  replacements,
}
