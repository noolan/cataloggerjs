# Catalogger.JS v0.1.0#
Library for filtering and sorting lists of objects.


## Examples ##

### Example 1 ###

```javascript
    
    import catalog from '@/catalog'
    import { people } from './lists.json'

    const personCatalog = catalog(items)

    const searchPeople = function (query) {
        return personCatalog.resultsFor(query)
    }

```


### Example 2 ###

```javascript
    
    import catalog from '@/catalog'
    import { places } from './lists.json'

    const locationCatalog = catalog( places, { using: 'address' })

    const searchPlaces = function (query) {
        return locationCatalog.resultsFor(query)
    }

```


### Example 3 ###

```javascript
    
    import { catalog, DEFAULT_CONFIG } from '@/catalog'
    import { things } from './lists.json'

    const thingCatalog = catalog(
        things,
        {
            using: ['name', 'desc', 'tags'],
            relevance: { threshold: 0.001 },
            results: { limit: 100 },
            sort: { enabled: false, fields: ['name'] },
            string: {
                replacements: [
                    ...DEFAULT_CONFIG.string.replacements,
                    { exp: /\b(?:color|clr)\b/g, val: 'colour' }
                ]
            }
        }
    )


    const searchThings = function (query) {
        return thingCatalog.resultsFor(query)
    }

    const toggleSorting = function () {
        thingCatalog.config = {
            sort: { enabled: !thingCatalog.config.sort.enabled }
        }
    }

```

### Example 4 ###

```javascript
    
    import catalog from '@/catalog'
    import { people, places, things } from './lists.json'

    const listCatalog = catalog()

    const searchPeople = function (query) {
        listCatalog.documents = people
        return listCatalog.resultsFor(query)
    }

    const searchPlaces = function (query) {
        listCatalog.documents = places
        listCatalog.fields = 'address'
        return listCatalog.resultsFor(query)
    }

    const searchThings = function (query) {
        listCatalog.documents = things
        listCatalog.fields = ['name', 'desc', 'tags']
        return thingCatalog.resultsFor(query)
    }


```