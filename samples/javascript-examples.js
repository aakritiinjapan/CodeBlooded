/**
 * Sample JavaScript file with various complexity levels
 * Tests JavaScript-specific syntax and patterns
 */

// LOW COMPLEXITY (1-5)

/**
 * Simple arrow function
 * Cyclomatic Complexity: 1
 */
export const multiply = (a, b) => a * b;

/**
 * Function with destructuring
 * Cyclomatic Complexity: 2
 */
export function getUserInfo({ name, email }) {
  if (!name || !email) {
    return null;
  }
  return { name, email };
}

/**
 * Function with default parameters
 * Cyclomatic Complexity: 2
 */
export function greetUser(name = 'Guest') {
  return name === 'Guest' ? 'Hello, Guest!' : `Hello, ${name}!`;
}

// MEDIUM COMPLEXITY (6-10)

/**
 * Function with array methods and conditionals
 * Cyclomatic Complexity: 7
 */
export function processItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items
    .filter(item => item.active && item.price > 0)
    .map(item => {
      if (item.discount) {
        return {
          ...item,
          finalPrice: item.price * (1 - item.discount)
        };
      } else if (item.category === 'sale') {
        return {
          ...item,
          finalPrice: item.price * 0.9
        };
      }
      return item;
    })
    .sort((a, b) => {
      if (a.priority > b.priority) return -1;
      if (a.priority < b.priority) return 1;
      return 0;
    });
}

/**
 * Async function with error handling
 * Cyclomatic Complexity: 8
 */
export async function fetchUserData(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      } else if (response.status === 403) {
        throw new Error('Access denied');
      } else {
        throw new Error('Request failed');
      }
    }
    
    const data = await response.json();
    
    if (!data.id || !data.email) {
      throw new Error('Invalid user data');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

/**
 * Generator function with conditionals
 * Cyclomatic Complexity: 6
 */
export function* numberGenerator(start, end, step = 1) {
  if (start > end) {
    throw new Error('Start must be less than end');
  }
  
  for (let i = start; i <= end; i += step) {
    if (i % 2 === 0) {
      yield { value: i, type: 'even' };
    } else {
      yield { value: i, type: 'odd' };
    }
  }
}

// HIGH COMPLEXITY (11-15)

/**
 * Class with complex method
 * Cyclomatic Complexity: 12
 */
export class DataProcessor {
  constructor(config) {
    this.config = config || {};
  }
  
  process(data) {
    if (!data) {
      throw new Error('Data required');
    }
    
    const results = [];
    
    for (const item of data) {
      if (this.config.filterInvalid && !this.isValid(item)) {
        continue;
      }
      
      let processed = item;
      
      if (this.config.transform) {
        if (typeof this.config.transform === 'function') {
          processed = this.config.transform(item);
        } else if (this.config.transform === 'uppercase') {
          processed = { ...item, name: item.name?.toUpperCase() };
        } else if (this.config.transform === 'lowercase') {
          processed = { ...item, name: item.name?.toLowerCase() };
        }
      }
      
      if (this.config.addMetadata) {
        processed = {
          ...processed,
          processedAt: new Date().toISOString(),
          processorVersion: '1.0.0'
        };
      }
      
      results.push(processed);
    }
    
    return results;
  }
  
  isValid(item) {
    return item && typeof item === 'object' && item.name;
  }
}

/**
 * Function with promise chains and error handling
 * Cyclomatic Complexity: 13
 */
export function complexAsyncOperation(options) {
  return new Promise((resolve, reject) => {
    if (!options) {
      reject(new Error('Options required'));
      return;
    }
    
    if (!options.url) {
      reject(new Error('URL required'));
      return;
    }
    
    fetch(options.url)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Not found');
          } else if (response.status === 500) {
            throw new Error('Server error');
          } else {
            throw new Error('Request failed');
          }
        }
        return response.json();
      })
      .then(data => {
        if (options.validate) {
          if (!data.id) {
            throw new Error('Missing ID');
          }
          if (!data.name) {
            throw new Error('Missing name');
          }
        }
        
        if (options.transform) {
          return options.transform(data);
        }
        
        return data;
      })
      .then(result => {
        if (options.cache) {
          localStorage.setItem(options.cacheKey || 'data', JSON.stringify(result));
        }
        resolve(result);
      })
      .catch(error => {
        if (options.fallback) {
          resolve(options.fallback);
        } else {
          reject(error);
        }
      });
  });
}

// CRITICAL COMPLEXITY (16+)

/**
 * CRITICAL: Complex event handler with many branches
 * Cyclomatic Complexity: 18
 * ☠️ REFACTOR IMMEDIATELY ☠️
 */
export function handleComplexEvent(event, state, config) {
  if (!event || !state) {
    return null;
  }
  
  const newState = { ...state };
  
  if (event.type === 'click') {
    if (event.target.classList.contains('button')) {
      if (event.target.dataset.action === 'submit') {
        if (state.formValid) {
          newState.submitted = true;
        } else {
          newState.error = 'Form invalid';
        }
      } else if (event.target.dataset.action === 'cancel') {
        newState.cancelled = true;
      } else if (event.target.dataset.action === 'reset') {
        newState.reset = true;
      }
    } else if (event.target.classList.contains('link')) {
      if (event.ctrlKey || event.metaKey) {
        newState.openInNewTab = true;
      } else {
        newState.navigate = true;
      }
    }
  } else if (event.type === 'keydown') {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        newState.newLine = true;
      } else if (state.formValid) {
        newState.submitted = true;
      }
    } else if (event.key === 'Escape') {
      newState.cancelled = true;
    } else if (event.key === 'Tab') {
      if (event.shiftKey) {
        newState.focusPrevious = true;
      } else {
        newState.focusNext = true;
      }
    }
  } else if (event.type === 'change') {
    if (event.target.type === 'checkbox') {
      newState.checked = event.target.checked;
    } else if (event.target.type === 'radio') {
      newState.selected = event.target.value;
    }
  }
  
  if (config && config.logging) {
    console.log('Event handled:', event.type, newState);
  }
  
  return newState;
}

/**
 * Closure with complex logic
 * Cyclomatic Complexity: 10
 */
export function createComplexCounter(initialValue = 0, options = {}) {
  let count = initialValue;
  const history = [];
  
  return {
    increment() {
      if (options.max && count >= options.max) {
        return count;
      }
      count++;
      if (options.trackHistory) {
        history.push({ action: 'increment', value: count, timestamp: Date.now() });
      }
      return count;
    },
    
    decrement() {
      if (options.min && count <= options.min) {
        return count;
      }
      count--;
      if (options.trackHistory) {
        history.push({ action: 'decrement', value: count, timestamp: Date.now() });
      }
      return count;
    },
    
    reset() {
      count = initialValue;
      if (options.trackHistory) {
        history.push({ action: 'reset', value: count, timestamp: Date.now() });
      }
      return count;
    },
    
    getHistory() {
      return options.trackHistory ? [...history] : null;
    }
  };
}
