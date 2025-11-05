/**
 * Sample TypeScript file with LOW complexity functions (1-5)
 * These functions should trigger Midnight Blue highlighting and deep hum audio (220-330Hz)
 */

/**
 * Simple addition function
 * Cyclomatic Complexity: 1
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Simple greeting function
 * Cyclomatic Complexity: 1
 */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

/**
 * Function with single conditional
 * Cyclomatic Complexity: 2
 */
export function isPositive(num: number): boolean {
  if (num > 0) {
    return true;
  }
  return false;
}

/**
 * Function with two conditionals
 * Cyclomatic Complexity: 3
 */
export function getGrade(score: number): string {
  if (score >= 90) {
    return 'A';
  } else if (score >= 80) {
    return 'B';
  }
  return 'C';
}

/**
 * Function with simple loop and conditional
 * Cyclomatic Complexity: 3
 */
export function sumPositive(numbers: number[]): number {
  let sum = 0;
  for (const num of numbers) {
    if (num > 0) {
      sum += num;
    }
  }
  return sum;
}

/**
 * Function with multiple simple checks
 * Cyclomatic Complexity: 4
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  if (!email.includes('@')) return false;
  if (email.length < 5) return false;
  if (email.startsWith('@')) return false;
  return true;
}

/**
 * Function with ternary operator
 * Cyclomatic Complexity: 2
 */
export function getStatus(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive';
}

/**
 * Simple array filter
 * Cyclomatic Complexity: 2
 */
export function filterEven(numbers: number[]): number[] {
  return numbers.filter(num => num % 2 === 0);
}

/**
 * Simple object property access
 * Cyclomatic Complexity: 1
 */
export function getUserName(user: { name: string }): string {
  return user.name;
}

/**
 * Function with early return
 * Cyclomatic Complexity: 2
 */
export function divide(a: number, b: number): number | null {
  if (b === 0) {
    return null;
  }
  return a / b;
}
