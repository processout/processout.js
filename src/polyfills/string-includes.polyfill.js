// String.prototype.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// String.prototype.startsWith polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search, start) {
    'use strict';
    
    if (typeof start !== 'number') {
      start = 0;
    }
    
    return this.substr(start, search.length) === search;
  };
} 