/**
 * Edge cases for testing codeblooded parser and analyzer
 * These files test various edge conditions and special scenarios
 */

// EDGE CASE 1: Empty file (should handle gracefully)
// This file intentionally has minimal content

// EDGE CASE 2: Only comments
/**
 * This file contains only comments
 * No actual code to analyze
 * Should result in zero complexity
 */

// EDGE CASE 3: Single line function
export const singleLine = () => 42;

// EDGE CASE 4: Function with no body
export function emptyFunction() {}

// EDGE CASE 5: Function with only return
export function justReturn() {
  return;
}

// EDGE CASE 6: Immediately invoked function expression (IIFE)
(function() {
  console.log('IIFE executed');
})();

// EDGE CASE 7: Function with very long parameter list
export function manyParameters(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number,
  j: number
): number {
  return a + b + c + d + e + f + g + h + i + j;
}

// EDGE CASE 8: Recursive function
export function factorial(n: number): number {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

// EDGE CASE 9: Function with only throw
export function alwaysThrows(): never {
  throw new Error('This function always throws');
}

// EDGE CASE 10: Function with complex type annotations
export function complexTypes<T extends { id: number; name: string }>(
  items: T[],
  predicate: (item: T) => boolean
): T | undefined {
  return items.find(predicate);
}

// EDGE CASE 11: Function with rest parameters
export function sumAll(...numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

// EDGE CASE 12: Function with optional chaining
export function safeAccess(obj: any): string | undefined {
  return obj?.user?.profile?.name;
}

// EDGE CASE 13: Function with nullish coalescing
export function withDefault(value: string | null | undefined): string {
  return value ?? 'default';
}

// EDGE CASE 14: Async generator function
export async function* asyncGenerator() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
  yield await Promise.resolve(3);
}

// EDGE CASE 15: Function with template literals
export function formatMessage(name: string, age: number): string {
  return `User ${name} is ${age} years old`;
}

// EDGE CASE 16: Function with regex
export function validatePattern(input: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]{3,16}$/;
  return pattern.test(input);
}

// EDGE CASE 17: Function with bitwise operators
export function bitwiseOperations(a: number, b: number): number {
  return (a & b) | (a ^ b);
}

// EDGE CASE 18: Function with typeof checks
export function typeCheck(value: unknown): string {
  if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  }
  return 'unknown';
}

// EDGE CASE 19: Function with instanceof checks
export function instanceCheck(value: any): string {
  if (value instanceof Array) {
    return 'array';
  } else if (value instanceof Date) {
    return 'date';
  } else if (value instanceof Error) {
    return 'error';
  }
  return 'unknown';
}

// EDGE CASE 20: Function with in operator
export function hasProperty(obj: any, prop: string): boolean {
  return prop in obj;
}

// EDGE CASE 21: Function with delete operator
export function removeProperty(obj: any, prop: string): boolean {
  return delete obj[prop];
}

// EDGE CASE 22: Function with void operator
export function voidFunction(): void {
  void console.log('This returns undefined');
}

// EDGE CASE 23: Arrow function with implicit return
export const implicitReturn = (x: number) => x * 2;

// EDGE CASE 24: Arrow function with object literal return
export const returnObject = (name: string) => ({ name, timestamp: Date.now() });

// EDGE CASE 25: Function with labeled statement
export function withLabel(): number {
  let result = 0;
  outer: for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (i * j > 50) {
        break outer;
      }
      result++;
    }
  }
  return result;
}

// EDGE CASE 26: Function with comma operator
export function commaOperator(): number {
  let x = 0;
  return (x++, x++, x);
}

// EDGE CASE 27: Function with conditional (ternary) chains
export function ternaryChain(value: number): string {
  return value > 100 ? 'high' : value > 50 ? 'medium' : value > 0 ? 'low' : 'zero';
}

// EDGE CASE 28: Function with spread operator
export function mergeObjects(...objects: any[]): any {
  return Object.assign({}, ...objects);
}

// EDGE CASE 29: Function with destructuring in parameters
export function destructureParams({ x, y }: { x: number; y: number }): number {
  return x + y;
}

// EDGE CASE 30: Function with default destructured parameters
export function defaultDestructure({ x = 0, y = 0 } = {}): number {
  return x + y;
}

// EDGE CASE 31: Class with static methods
export class StaticMethods {
  static create(): StaticMethods {
    return new StaticMethods();
  }
  
  static isValid(obj: any): boolean {
    return obj instanceof StaticMethods;
  }
}

// EDGE CASE 32: Class with getters and setters
export class GettersSetters {
  private _value: number = 0;
  
  get value(): number {
    return this._value;
  }
  
  set value(v: number) {
    if (v < 0) {
      throw new Error('Value must be positive');
    }
    this._value = v;
  }
}

// EDGE CASE 33: Class with private fields
export class PrivateFields {
  #privateValue: number = 0;
  
  getPrivateValue(): number {
    return this.#privateValue;
  }
  
  setPrivateValue(value: number): void {
    this.#privateValue = value;
  }
}

// EDGE CASE 34: Abstract class
export abstract class AbstractBase {
  abstract process(): void;
  
  common(): string {
    return 'common';
  }
}

// EDGE CASE 35: Interface (should not count as code)
export interface TestInterface {
  id: number;
  name: string;
  process(): void;
}

// EDGE CASE 36: Type alias (should not count as code)
export type TestType = {
  id: number;
  name: string;
};

// EDGE CASE 37: Enum
export enum TestEnum {
  First = 1,
  Second = 2,
  Third = 3
}

// EDGE CASE 38: Namespace
export namespace TestNamespace {
  export function helper(): string {
    return 'helper';
  }
}

// EDGE CASE 39: Decorator (if supported)
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey}`);
    return original.apply(this, args);
  };
}

export class WithDecorator {
  @log
  method(): void {
    console.log('method called');
  }
}

// EDGE CASE 40: Function with assertion
export function assertNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Not a number');
  }
}
