const clone = function (variable) {
  if (typeof variable === 'object') {
    return JSON.parse(JSON.stringify(variable))
  } else {
    return variable
  }
}

const cloneEnumerable = function (v) {
  try {
    return typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v
  } catch (e) {
    console.error(e, v)
    return v
  }
}

const getNestedValue = function (
  obj,
  keys = [],
  {
    defaultValue = undefined, idProperty = 'id', intsAreIds = true, keySeparator = '/'
  } = {
    defaultValue: undefined, idProperty: 'id', intsAreIds: true, keySeparator: '/'
  }
) {
  if (typeof keys === 'string') {
    keys = keys.split(keySeparator)
  }
  if (!Array.isArray(keys)) {
    namedLogError('Invalid keys parameter', {keys})
    return defaultValue
  }

  if (keys.length) {
    if (typeof obj !== 'object' || obj === null) {
      namedLogError('Nested object not found at given key', {obj, key})
      return defaultValue
    }
    const key = keys.splice(0, 1)[0]
    if (key === '') {
      return getNestedValue(obj, keys, { defaultValue, idProperty, intsAreIds })
    }
    const int = parseInt(key, 10)
    if (!Number.isNaN(int)) {
      if (intsAreIds) {
        const found = findByProperty(obj, idProperty, int, { castToInt: true })
        if (typeof found !== 'undefined') {
          return getNestedValue(found, keys, { defaultValue, idProperty, intsAreIds })
        }
      } else if (typeof obj[int] !== 'undefined') {
        return getNestedValue(obj[int], keys, { defaultValue, idProperty, intsAreIds })
      }
    }
    if (typeof obj[key] !== 'undefined') {
      return getNestedValue(obj[key], keys, { defaultValue, idProperty, intsAreIds })
    }
    namedLogError('Nested object not found at given key', {obj, key})
    return defaultValue
  } else {
    return obj
  }
}

const logError = function (...args) {
  for (const arg of args) {
    if (typeof arg === 'object') {
      console.error(clone(arg))
    } else {
      console.error(arg)
    }
  }
  return args
}

const namedLogError = function (name, ...args) {
  console.group(name)
  logError(args)
  console.groupEnd()
}

const valueToArray = function (
  value,
  { 
    blank = [], removeEmpty = false, separator = undefined, trimStrings = false
  } = {
    blank: [], removeEmpty: false, separator: undefined, trimStrings: false
  }
) {
  let arr = null
  switch (typeof value) {
    case 'object':
      if (value === null) { return blank }
      arr = [...(typeof value[Symbol.iterator] === 'function' ? value : Object.values(value))]
      break
    case 'undefined': return blank
    case 'string':
    default: value = String(value)
      arr = value.split(separator)
  }

  if (trimStrings) {
    for (let i=0; i<arr.length; i++) {
      if (typeof arr[i] === 'string') {
        arr[i] = arr[i].trim()
      }
    }
  }

  if (removeEmpty) {
    for (let i=0; i<arr.length; i++) {
      const type = typeof arr[i]
      if (
        (type === 'string' && arr[i].trim() === '') ||
        arr[i] === null || type === 'undefined'
      ) {
        arr.splice(i--, 1)
      }
    }
  }
  return arr
}

const valueToString = function (value, { blank = '', glue = ', ' } = { blank: '', glue: ', ' }) {
  switch (typeof value) {
    case 'string': return value
    case 'object':
      if (value === null) { return blank }
      return [...(typeof value[Symbol.iterator] === 'function' ? value : Object.values(value))].join(glue)
    case 'undefined': return blank
    default: return String(value)
  }
}

export { clone, cloneEnumerable, getNestedValue, logError, namedLogError, valueToArray, valueToString }
