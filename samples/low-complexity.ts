
export function add(a: number, b: number): number {
  return a + b;
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
