/**
 * Sample TypeScript file with HIGH complexity functions (11-15)
 * These functions should trigger Blood Orange highlighting and sharp tones (523-880Hz)
 * Cobweb overlays should appear on these functions
 */

/**
 * Function with deeply nested conditionals
 * Cyclomatic Complexity: 11
 */
export function processOrder(order: any): { success: boolean; message: string } {
  if (!order) {
    return { success: false, message: 'Order is required' };
  }
  
  if (!order.items || order.items.length === 0) {
    return { success: false, message: 'Order must have items' };
  }
  
  if (!order.customer) {
    return { success: false, message: 'Customer information required' };
  }
  
  if (order.customer.type === 'business') {
    if (!order.customer.taxId) {
      return { success: false, message: 'Business tax ID required' };
    }
    if (order.total > 10000 && !order.customer.creditApproved) {
      return { success: false, message: 'Credit approval required for large orders' };
    }
  } else if (order.customer.type === 'individual') {
    if (order.total > 5000 && !order.customer.verified) {
      return { success: false, message: 'Verification required for large orders' };
    }
  }
  
  if (order.shippingMethod === 'express') {
    if (!order.shippingAddress.zipCode) {
      return { success: false, message: 'ZIP code required for express shipping' };
    }
  } else if (order.shippingMethod === 'international') {
    if (!order.shippingAddress.country || !order.customsInfo) {
      return { success: false, message: 'Customs information required' };
    }
  }
  
  return { success: true, message: 'Order processed successfully' };
}

/**
 * Function with complex state machine logic
 * Cyclomatic Complexity: 12
 */
export function updateTaskStatus(
  task: any,
  newStatus: string,
  user: any
): { success: boolean; error?: string } {
  if (!task || !newStatus || !user) {
    return { success: false, error: 'Missing required parameters' };
  }
  
  const currentStatus = task.status;
  
  if (currentStatus === 'pending') {
    if (newStatus === 'in_progress' && user.role === 'developer') {
      return { success: true };
    } else if (newStatus === 'cancelled' && user.role === 'manager') {
      return { success: true };
    }
  } else if (currentStatus === 'in_progress') {
    if (newStatus === 'review' && task.assignee === user.id) {
      return { success: true };
    } else if (newStatus === 'blocked' && task.assignee === user.id) {
      return { success: true };
    } else if (newStatus === 'cancelled' && user.role === 'manager') {
      return { success: true };
    }
  } else if (currentStatus === 'review') {
    if (newStatus === 'approved' && user.role === 'reviewer') {
      return { success: true };
    } else if (newStatus === 'rejected' && user.role === 'reviewer') {
      return { success: true };
    } else if (newStatus === 'in_progress' && user.role === 'reviewer') {
      return { success: true };
    }
  } else if (currentStatus === 'blocked') {
    if (newStatus === 'in_progress' && task.assignee === user.id) {
      return { success: true };
    }
  }
  
  return { success: false, error: 'Invalid status transition' };
}

/**
 * Function with multiple nested loops and conditions
 * Cyclomatic Complexity: 13
 */
export function analyzeMatrix(matrix: number[][]): any {
  const result = {
    sum: 0,
    positiveCount: 0,
    negativeCount: 0,
    zeroCount: 0,
    maxValue: -Infinity,
    minValue: Infinity,
    diagonalSum: 0
  };
  
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const value = matrix[i][j];
      result.sum += value;
      
      if (value > 0) {
        result.positiveCount++;
      } else if (value < 0) {
        result.negativeCount++;
      } else {
        result.zeroCount++;
      }
      
      if (value > result.maxValue) {
        result.maxValue = value;
      }
      
      if (value < result.minValue) {
        result.minValue = value;
      }
      
      if (i === j) {
        result.diagonalSum += value;
      }
    }
  }  
  return result;
}

/**
 * Function with complex validation and transformation
 * Cyclomatic Complexity: 14
 */
export function transformUserData(rawData: any): any {
  if (!rawData) {
    throw new Error('Data is required');
  }
  
  const transformed: any = {};
  
  if (rawData.firstName && rawData.lastName) {
    transformed.fullName = `${rawData.firstName} ${rawData.lastName}`;
  } else if (rawData.name) {
    transformed.fullName = rawData.name;
  } else {
    throw new Error('Name is required');
  }
  
  if (rawData.email) {
    if (rawData.email.includes('@')) {
      transformed.email = rawData.email.toLowerCase();
    } else {
      throw new Error('Invalid email format');
    }
  }
  
  if (rawData.phone) {
    const cleaned = rawData.phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      transformed.phone = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      transformed.phone = `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else {
      throw new Error('Invalid phone number');
    }
  }
  
  if (rawData.birthDate) {
    const date = new Date(rawData.birthDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid birth date');
    }
    transformed.birthDate = date.toISOString();
    
    const age = new Date().getFullYear() - date.getFullYear();
    if (age < 13) {
      throw new Error('User must be at least 13 years old');
    }
    transformed.age = age;
  }
  
  return transformed;
}

/**
 * Function with complex business logic
 * Cyclomatic Complexity: 15
 */
export function calculateShippingCost(
  weight: number,
  distance: number,
  destination: string,
  shippingSpeed: string,
  insurance: boolean,
  fragile: boolean
): number {
  let cost = 0;
  
  // Base cost by weight
  if (weight <= 1) {
    cost = 5;
  } else if (weight <= 5) {
    cost = 10;
  } else if (weight <= 10) {
    cost = 20;
  } else {
    cost = 20 + (weight - 10) * 2;
  }
  
  // Distance multiplier
  if (distance < 100) {
    cost *= 1.0;
  } else if (distance < 500) {
    cost *= 1.5;
  } else if (distance < 1000) {
    cost *= 2.0;
  } else {
    cost *= 3.0;
  }
  
  // Destination surcharge
  if (destination === 'international') {
    cost *= 2.5;
  } else if (destination === 'remote') {
    cost *= 1.8;
  }
  
  // Speed adjustment
  if (shippingSpeed === 'express') {
    cost *= 2.0;
  } else if (shippingSpeed === 'overnight') {
    cost *= 3.0;
  }
  
  // Additional services
  if (insurance) {
    cost += 10;
  }
  
  if (fragile) {
    cost += 15;
  }
  
  return Math.round(cost * 100) / 100;
}
