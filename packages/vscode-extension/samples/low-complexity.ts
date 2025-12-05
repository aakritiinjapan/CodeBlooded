


export function add(a: number, b: number): number {
  return a + b;
}


export function greet(name: string): string {
  return `Hello, ${name}!`;
}


export function isPositive(num: number): boolean {
  if (num > 0) {
    return true;
  }
  return false;
}


export function getGrade(score: number): string {
  if (score >= 90) {
    return 'A';
  } else if (score >= 80) {
    return 'B';
  }
  return 'C';
}


export function sumPositive(numbers: number[]): number {
  let sum = 0;
  for (const num of numbers) {
    if (num > 0) {
      sum += num;
    }
  }
  return sum;
}


export function validateEmail(email: string): boolean {
  if (!email) return false;
  if (!email.includes('@')) return false;
  if (email.length < 5) return false;
  if (email.startsWith('@')) return false;
  return true;
}


export function getStatus(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive';
}


export function filterEven(numbers: number[]): number[] {
  return numbers.filter(num => num % 2 === 0);
}


export function getUserName(user: { name: string }): string {
  return user.name;
}


export function divide(a: number, b: number): number | null {
  if (b === 0) {
    return null;
  }
  return a / b;
}
