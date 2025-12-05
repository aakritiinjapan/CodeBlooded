/**
 * Sample TypeScript file with CRITICAL complexity functions (16+)
 * These functions should trigger Crimson Red highlighting and harsh distorted tones (880Hz+)
 * Skull icons and blood drip animations should appear
 * These functions desperately need refactoring!
 */

/**
 * CRITICAL: Deeply nested validation function
 * Cyclomatic Complexity: 18
 * ☠️ REFACTOR IMMEDIATELY ☠️
 */
export function validateComplexForm(formData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (formData.personalInfo) {
    if (formData.personalInfo.firstName) {
      if (formData.personalInfo.firstName.length < 2) {
        errors.push('First name too short');
      } else if (formData.personalInfo.firstName.length > 50) {
        errors.push('First name too long');
      }
    } else {
      errors.push('First name required');
    }
    
    if (formData.personalInfo.lastName) {
      if (formData.personalInfo.lastName.length < 2) {
        errors.push('Last name too short');
      } else if (formData.personalInfo.lastName.length > 50) {
        errors.push('Last name too long');
      }
    } else {
      errors.push('Last name required');
    }
    
    if (formData.personalInfo.email) {
      if (!formData.personalInfo.email.includes('@')) {
        errors.push('Invalid email');
      } else if (formData.personalInfo.email.length > 100) {
        errors.push('Email too long');
      }
    } else {
      errors.push('Email required');
    }
  } else {
    errors.push('Personal info required');
  }
  
  if (formData.address) {
    if (!formData.address.street) {
      errors.push('Street required');
    }
    if (!formData.address.city) {
      errors.push('City required');
    }
    if (!formData.address.zipCode) {
      errors.push('ZIP code required');
    } else if (!/^\d{5}$/.test(formData.address.zipCode)) {
      errors.push('Invalid ZIP code');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * CRITICAL: Complex state machine with many transitions
 * Cyclomatic Complexity: 20
 * ☠️ REFACTOR IMMEDIATELY ☠️
 */
export function processWorkflowTransition(
  workflow: any,
  action: string,
  user: any,
  context: any
): { success: boolean; newState?: string; error?: string } {
  const currentState = workflow.state;
  
  if (currentState === 'draft') {
    if (action === 'submit' && user.role === 'author') {
      if (workflow.hasRequiredFields) {
        return { success: true, newState: 'pending_review' };
      } else {
        return { success: false, error: 'Missing required fields' };
      }
    } else if (action === 'delete' && user.role === 'author') {
      return { success: true, newState: 'deleted' };
    }
  } else if (currentState === 'pending_review') {
    if (action === 'approve' && user.role === 'reviewer') {
      if (context.hasApprovals >= 2) {
        return { success: true, newState: 'approved' };
      } else {
        return { success: true, newState: 'pending_review' };
      }
    } else if (action === 'reject' && user.role === 'reviewer') {
      return { success: true, newState: 'rejected' };
    } else if (action === 'request_changes' && user.role === 'reviewer') {
      return { success: true, newState: 'changes_requested' };
    }
  } else if (currentState === 'changes_requested') {
    if (action === 'resubmit' && user.role === 'author') {
      return { success: true, newState: 'pending_review' };
    } else if (action === 'cancel' && user.role === 'author') {
      return { success: true, newState: 'cancelled' };
    }
  } else if (currentState === 'approved') {
    if (action === 'publish' && user.role === 'publisher') {
      if (context.hasPublishPermission) {
        return { success: true, newState: 'published' };
      } else {
        return { success: false, error: 'No publish permission' };
      }
    } else if (action === 'revoke' && user.role === 'admin') {
      return { success: true, newState: 'revoked' };
    }
  } else if (currentState === 'published') {
    if (action === 'unpublish' && user.role === 'publisher') {
      return { success: true, newState: 'unpublished' };
    } else if (action === 'archive' && user.role === 'admin') {
      return { success: true, newState: 'archived' };
    }
  } else if (currentState === 'rejected') {
    if (action === 'appeal' && user.role === 'author') {
      return { success: true, newState: 'pending_appeal' };
    }
  }
  
  return { success: false, error: 'Invalid transition' };
}

/**
 * CRITICAL: Nested loops with complex conditions
 * Cyclomatic Complexity: 19
 * ☠️ REFACTOR IMMEDIATELY ☠️
 */
export function findComplexPatterns(data: any[][]): any[] {
  const patterns: any[] = [];
  
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const current = data[i][j];
      
      if (current.type === 'A') {
        if (current.value > 100) {
          if (j < data[i].length - 1) {
            const next = data[i][j + 1];
            if (next.type === 'B' && next.value > 50) {
              patterns.push({ type: 'AB_pattern', row: i, col: j });
            } else if (next.type === 'C' && next.value < 50) {
              patterns.push({ type: 'AC_pattern', row: i, col: j });
            }
          }
        } else if (current.value < 50) {
          if (i < data.length - 1) {
            const below = data[i + 1][j];
            if (below.type === 'D') {
              patterns.push({ type: 'AD_pattern', row: i, col: j });
            }
          }
        }
      } else if (current.type === 'B') {
        if (i > 0 && j > 0) {
          const diagonal = data[i - 1][j - 1];
          if (diagonal.type === 'A' && diagonal.value > current.value) {
            patterns.push({ type: 'diagonal_pattern', row: i, col: j });
          }
        }
      } else if (current.type === 'C') {
        if (current.value === 0) {
          let zeroCount = 0;
          for (let k = 0; k < data[i].length; k++) {
            if (data[i][k].value === 0) {
              zeroCount++;
            }
          }
          if (zeroCount > 3) {
            patterns.push({ type: 'zero_row', row: i });
          }
        }
      }
    }
  }
  
  return patterns;
}

/**
 * CRITICAL: Complex calculation with many branches
 * Cyclomatic Complexity: 22
 * ☠️ REFACTOR IMMEDIATELY ☠️
 */
export function calculateComplexPrice(
  product: any,
  customer: any,
  quantity: number,
  options: any
): number {
  let basePrice = product.basePrice;
  
  // Customer type discounts
  if (customer.type === 'premium') {
    if (customer.yearsActive > 5) {
      basePrice *= 0.7;
    } else if (customer.yearsActive > 2) {
      basePrice *= 0.8;
    } else {
      basePrice *= 0.9;
    }
  } else if (customer.type === 'business') {
    if (customer.employees > 100) {
      basePrice *= 0.75;
    } else if (customer.employees > 50) {
      basePrice *= 0.85;
    }
  } else if (customer.type === 'nonprofit') {
    basePrice *= 0.6;
  }
  
  // Quantity discounts
  if (quantity > 100) {
    basePrice *= 0.8;
  } else if (quantity > 50) {
    basePrice *= 0.85;
  } else if (quantity > 20) {
    basePrice *= 0.9;
  } else if (quantity > 10) {
    basePrice *= 0.95;
  }
  
  // Seasonal adjustments
  const month = new Date().getMonth();
  if (month === 11 || month === 0) {
    basePrice *= 1.2;
  } else if (month >= 5 && month <= 7) {
    basePrice *= 0.9;
  }
  
  // Options
  if (options.expeditedShipping) {
    basePrice += 50;
  }
  
  if (options.giftWrap) {
    basePrice += 10;
  }
  
  if (options.insurance) {
    if (basePrice > 1000) {
      basePrice += 100;
    } else if (basePrice > 500) {
      basePrice += 50;
    } else {
      basePrice += 25;
    }
  }
  
  if (options.warranty) {
    if (options.warrantyYears === 5) {
      basePrice += 200;
    } else if (options.warrantyYears === 3) {
      basePrice += 100;
    } else if (options.warrantyYears === 1) {
      basePrice += 50;
    }
  }
  
  return Math.round(basePrice * quantity * 100) / 100;
}

/**
 * CRITICAL: Deeply nested error handling
 * Cyclomatic Complexity: 17
 * ☠️ REFACTOR IMMEDIATELY ☠️
 */
export function processComplexRequest(request: any): any {
  try {
    if (!request) {
      throw new Error('Request is null');
    }
    
    if (!request.data) {
      throw new Error('Request data is missing');
    }
    
    try {
      const parsed = JSON.parse(request.data);
      
      if (parsed.type === 'create') {
        if (!parsed.payload) {
          throw new Error('Payload missing');
        }
        if (!parsed.payload.name) {
          throw new Error('Name missing');
        }
        return { success: true, action: 'created' };
      } else if (parsed.type === 'update') {
        if (!parsed.id) {
          throw new Error('ID missing');
        }
        if (!parsed.payload) {
          throw new Error('Payload missing');
        }
        return { success: true, action: 'updated' };
      } else if (parsed.type === 'delete') {
        if (!parsed.id) {
          throw new Error('ID missing');
        }
        return { success: true, action: 'deleted' };
      } else {
        throw new Error('Unknown type');
      }
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error('Invalid JSON');
      } else {
        throw parseError;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
