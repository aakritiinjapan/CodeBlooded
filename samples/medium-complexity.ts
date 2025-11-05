/**
 * Sample TypeScript file with MEDIUM complexity functions (6-10)
 * These functions should trigger Toxic Purple highlighting and eerie notes (330-523Hz)
 */

/**
 * Function with multiple conditionals and logical operators
 * Cyclomatic Complexity: 6
 */
export function canAccessResource(user: any, resource: any): boolean {
  if (!user) return false;
  if (!resource) return false;
  
  if (user.isAdmin) {
    return true;
  } else if (user.id === resource.ownerId) {
    return true;
  } else if (resource.isPublic && user.isVerified) {
    return true;
  } else if (user.permissions.includes('read')) {
    return true;
  }
  
  return false;
}

/**
 * Function with switch statement
 * Cyclomatic Complexity: 7
 */
export function getColorCode(color: string): string {
  switch (color.toLowerCase()) {
    case 'red':
      return '#FF0000';
    case 'green':
      return '#00FF00';
    case 'blue':
      return '#0000FF';
    case 'yellow':
      return '#FFFF00';
    case 'purple':
      return '#800080';
    case 'orange':
      return '#FFA500';
    default:
      return '#000000';
  }
}

/**
 * Function with nested loops and conditionals
 * Cyclomatic Complexity: 8
 */
export function findPairs(numbers: number[], target: number): number[][] {
  const pairs: number[][] = [];
  
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) {
        pairs.push([numbers[i], numbers[j]]);
      } else if (numbers[i] * numbers[j] === target) {
        pairs.push([numbers[i], numbers[j]]);
      }
    }
  }
  
  return pairs;
}

/**
 * Function with multiple validation checks
 * Cyclomatic Complexity: 9
 */
export function validateUser(user: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!user.name || user.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!user.email || !user.email.includes('@')) {
    errors.push('Invalid email address');
  }
  
  if (!user.password || user.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (user.age && (user.age < 13 || user.age > 120)) {
    errors.push('Age must be between 13 and 120');
  }
  
  if (user.username && !/^[a-zA-Z0-9_]+$/.test(user.username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Function with complex conditional logic
 * Cyclomatic Complexity: 10
 */
export function calculateDiscount(
  price: number,
  quantity: number,
  customerType: string,
  hasPromoCode: boolean
): number {
  let discount = 0;
  
  if (customerType === 'premium') {
    discount = 0.2;
  } else if (customerType === 'regular' && quantity > 10) {
    discount = 0.1;
  } else if (customerType === 'new' && hasPromoCode) {
    discount = 0.15;
  }
  
  if (quantity > 50) {
    discount += 0.05;
  } else if (quantity > 100) {
    discount += 0.1;
  }
  
  if (price > 1000 && discount < 0.15) {
    discount = 0.15;
  }
  
  if (hasPromoCode && discount < 0.1) {
    discount = 0.1;
  }
  
  return Math.min(discount, 0.5);
}

/**
 * Function with try-catch and multiple conditions
 * Cyclomatic Complexity: 8
 */
export function parseAndValidateJSON(jsonString: string): any {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data) {
      throw new Error('Empty data');
    }
    
    if (typeof data !== 'object') {
      throw new Error('Data must be an object');
    }
    
    if (Array.isArray(data) && data.length === 0) {
      throw new Error('Array cannot be empty');
    }
    
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON syntax');
    } else if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error');
  }
}

/**
 * Function with logical operators
 * Cyclomatic Complexity: 7
 */
export function shouldSendNotification(
  user: any,
  event: any
): boolean {
  return (
    user.notificationsEnabled &&
    (event.priority === 'high' || event.isUrgent) &&
    (user.isOnline || event.sendEmail) &&
    (!user.doNotDisturb || event.override)
  );
}
