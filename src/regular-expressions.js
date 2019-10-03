export const REGEXP = {
  // matches single characters surrounded by whitespace or at the beginning/end of a line
  singleCharacters: /(?:(?<=^|\s).(?=$|\s))/gm,
  
  // matches common punctuation except for decimal places and inch/foot symbols
  punctuation: /(?:\(|\)|\[|\]|\{|\}|\,|\.(?!\d)|(?<!\d)[\"\'])/g,
  
  // matches all whitespace characters
  whitespace: /\s/g,
  
  //  matches all whitespace characters except spaces
  tabsAndVerticalWhitespace: /[\t\v]/g,
  
  // matches multiple spaces
  multiSpace: /\ \ +/g,
  
  // matches multiple whitespace characters
  multiWhitespace: /\s\s+/g,
  
  // matches common articles and determiners
  articlesAndDeterminers: /\b(?:a|and|of|to)\b/g
}
