/**
 * MEDIUM COMPLEXITY EXAMPLE
 * Should show: Purple theme, warning emoji ⚠️, moderate sounds
 */

export class UserValidator {
  /**
   * Validate user input - Complexity: 6-7
   * Has multiple conditions and some nesting
   */
  validateUser(user: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check username
    if (!user.username) {
      errors.push('Username is required');
    } else if (user.username.length < 3) {
      errors.push('Username too short');
    } else if (user.username.length > 20) {
      errors.push('Username too long');
    }

    // Check email
    if (!user.email) {
      errors.push('Email is required');
    } else if (!user.email.includes('@')) {
      errors.push('Invalid email format');
    }

    // Check age
    if (user.age && user.age < 18) {
      errors.push('Must be 18 or older');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Process user status - Complexity: 5-6
   */
  getUserStatus(user: any): string {
    if (user.isActive) {
      if (user.isPremium) {
        return 'Premium Active';
      } else {
        return 'Standard Active';
      }
    } else {
      if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
        return 'Suspended';
      } else {
        return 'Inactive';
      }
    }
  }
}
