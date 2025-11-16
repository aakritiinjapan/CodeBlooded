/**
 * LOW COMPLEXITY EXAMPLE
 * Should show: Blue/Green theme, peaceful sounds, no decorations
 */

export class Calculator {
  /**
   * Simple addition - Complexity: 1
   */
  add(a: number, b: number): number {
    return a + b;
  }

  /**
   * Simple subtraction - Complexity: 1
   */
  subtract(a: number, b: number): number {
    return a - b;
  }

  /**
   * Simple multiplication - Complexity: 1
   */
  multiply(a: number, b: number): number {
    return a * b;
  }

  /**
   * Simple division with one condition - Complexity: 2
   */
  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}

// Simple helper function
export function formatNumber(num: number): string {
  return num.toFixed(2);
}
