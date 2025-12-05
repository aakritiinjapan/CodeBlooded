/**
 * Demo file for testing Whispering Variables feature
 * 
 * This file contains many variables that will be whispered when
 * horror intensity > 60%
 */

// User-related variables
const user = { name: 'John', id: 123 };
const data = { secrets: 'hidden' };

// Common programming variables
let value = 42;
let result = null;
let error = new Error('Something went wrong');
let success = true;

// Collection variables
const list = [1, 2, 3];
const array = ['a', 'b', 'c'];
const object = { key: 'value' };

// Function-related
function callback() {
  return 'done';
}

async function promise() {
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// State management
let state = { active: true };
let context = { user, data };
let config = { setting: 'value' };

// API-related
const request = { method: 'GET' };
const response = { status: 200 };
const message = 'Hello World';
const status = 'ok';

// Misc
const code = 'secret';
const key = 'unlock';
const token = 'auth123';
const session = { id: 'abc' };

export { user, data, value, result, error, success };
