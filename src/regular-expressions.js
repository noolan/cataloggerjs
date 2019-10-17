// negative and positive lookbehinds are not supported in Edge, Firefox, or Safari as of Oct 2019
// https://caniuse.com/#feat=js-regexp-lookbehind

const REGULAR_EXPRESSIONS = {
  // matches common articles and determiners
  articlesAndDeterminers: /\b(?:a|an|and|are|is|of|the|to)\b/g,

  // matches multiple spaces
  multiSpace: /\ \ +/g,

  // matches multiple whitespace characters
  multiWhitespace: /\s\s+/g,

  // matches common punctuation except for decimal/thousands separators and number signs (+/-)
  punctuation: /(?:(\.|\,)(?!\d)|(?:[^\d](\+|\-)[^\d])|([\(\)\[\]\{\}\?\:\;\"\'\_\=]))/g, // has capture group
  punctuationLookbehind: /[\.\,](?!\d)|(?<!\d)[\+\-](?!\d)|[\(\)\[\]\{\}\?\:\;\"\'\_\=]/g,

  // matches single letters/digits surrounded by whitespace or at the beginning/end of strings/lines
  singleCharacters: /(?:^|\s)([a-z0-9])(?=$|\s)/gm, // has capture group
  singleCharactersLookbehind: /(?:(?<=^|\s).(?=$|\s))/gm,
  
  // matches single characters at word boundries
  singleCharactersWordBoundries: /\b[a-z0-9]\b/g,
  
  //  matches all whitespace characters except spaces (newlines, tabs, vertical tabs)
  tabsAndVerticalWhitespace: /[\t\v]/g,
  
  // matches all whitespace characters 
  // newlines, spaces, tabs, vertical tabs
  whitespace: /\s/g,
}

export default REGULAR_EXPRESSIONS