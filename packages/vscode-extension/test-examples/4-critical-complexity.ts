/**
 * CRITICAL COMPLEXITY EXAMPLE
 * Should show: RED theme, skull/blood emojis ☠️🩸, horror sounds, fog effect
 */

export class LegacyPaymentProcessor {
  /**
   * DANGEROUS: Process payment - Complexity: 20+
   * This is intentionally terrible code to trigger critical warnings
   */
  processPayment(payment: any, account: any, config: any): any {
    const result: any = { status: 'pending', errors: [], warnings: [] };

    if (payment) {
      if (payment.amount && payment.amount > 0) {
        if (account) {
          if (account.balance !== undefined) {
            if (account.status === 'active') {
              if (!account.frozen) {
                if (payment.currency) {
                  if (payment.currency === 'USD') {
                    if (config.usdEnabled) {
                      if (account.balance >= payment.amount) {
                        if (payment.amount < 10000) {
                          account.balance -= payment.amount;
                          result.status = 'success';
                        } else {
                          if (account.verified) {
                            if (account.vipLevel > 2) {
                              account.balance -= payment.amount;
                              result.status = 'success';
                            } else {
                              result.errors.push('Large payment requires VIP3+');
                            }
                          } else {
                            result.errors.push('Account not verified for large payments');
                          }
                        }
                      } else {
                        if (account.overdraftAllowed) {
                          if (account.overdraftLimit >= (payment.amount - account.balance)) {
                            account.balance -= payment.amount;
                            result.status = 'success';
                            result.warnings.push('Overdraft used');
                          } else {
                            result.errors.push('Overdraft limit exceeded');
                          }
                        } else {
                          result.errors.push('Insufficient funds');
                        }
                      }
                    } else {
                      result.errors.push('USD payments disabled');
                    }
                  } else if (payment.currency === 'EUR') {
                    if (config.eurEnabled) {
                      const convertedAmount = payment.amount * config.eurRate;
                      if (account.balance >= convertedAmount) {
                        account.balance -= convertedAmount;
                        result.status = 'success';
                      } else {
                        result.errors.push('Insufficient funds (EUR)');
                      }
                    } else {
                      result.errors.push('EUR not supported');
                    }
                  } else {
                    result.errors.push('Unsupported currency');
                  }
                } else {
                  result.errors.push('Currency required');
                }
              } else {
                result.errors.push('Account frozen');
              }
            } else {
              result.errors.push('Account not active');
            }
          } else {
            result.errors.push('Invalid account balance');
          }
        } else {
          result.errors.push('Account not found');
        }
      } else {
        result.errors.push('Invalid amount');
      }
    } else {
      result.errors.push('Payment object required');
    }

    return result;
  }

  /**
   * NIGHTMARE: User permissions validator - Complexity: 25+
   * Multiple nested conditions, no early returns, terrible logic
   */
  validateUserPermissions(user: any, resource: any, action: any, context: any): boolean {
    let canAccess = false;

    if (user) {
      if (user.id) {
        if (user.roles && user.roles.length > 0) {
          if (resource) {
            if (resource.type) {
              if (action) {
                if (action === 'read') {
                  if (user.roles.includes('viewer') || user.roles.includes('admin')) {
                    if (resource.public) {
                      canAccess = true;
                    } else {
                      if (resource.ownerId === user.id) {
                        canAccess = true;
                      } else {
                        if (user.department === resource.department) {
                          if (context.shareEnabled) {
                            canAccess = true;
                          }
                        }
                      }
                    }
                  }
                } else if (action === 'write') {
                  if (user.roles.includes('editor') || user.roles.includes('admin')) {
                    if (resource.locked) {
                      if (user.roles.includes('admin')) {
                        if (context.overrideEnabled) {
                          canAccess = true;
                        }
                      }
                    } else {
                      if (resource.ownerId === user.id) {
                        canAccess = true;
                      } else {
                        if (user.roles.includes('admin')) {
                          canAccess = true;
                        } else {
                          if (resource.collaborators && resource.collaborators.includes(user.id)) {
                            if (context.collaborationEnabled) {
                              canAccess = true;
                            }
                          }
                        }
                      }
                    }
                  }
                } else if (action === 'delete') {
                  if (user.roles.includes('admin')) {
                    if (resource.protected) {
                      if (user.superAdmin) {
                        if (context.dangerousOperationsEnabled) {
                          if (user.twoFactorVerified) {
                            canAccess = true;
                          }
                        }
                      }
                    } else {
                      canAccess = true;
                    }
                  } else if (resource.ownerId === user.id) {
                    if (!resource.permanent) {
                      if (context.selfDeleteEnabled) {
                        canAccess = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return canAccess;
  }
}

/**
 * HORROR: Data transformation nightmare - Complexity: 30+
 * Deeply nested loops and conditions, no helper functions
 */
export class DataTransformer {
  transformData(data: any, schema: any, options: any): any {
    const output: any = {};

    if (data && schema && options) {
      if (Array.isArray(data)) {
        output.items = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i]) {
            const item: any = {};
            if (schema.fields) {
              for (let j = 0; j < schema.fields.length; j++) {
                const field = schema.fields[j];
                if (field.name) {
                  if (data[i][field.name] !== undefined) {
                    if (field.type === 'string') {
                      if (options.trimStrings) {
                        if (typeof data[i][field.name] === 'string') {
                          item[field.name] = data[i][field.name].trim();
                        } else {
                          item[field.name] = String(data[i][field.name]);
                        }
                      } else {
                        item[field.name] = data[i][field.name];
                      }
                    } else if (field.type === 'number') {
                      if (typeof data[i][field.name] === 'number') {
                        if (field.min !== undefined) {
                          if (data[i][field.name] >= field.min) {
                            if (field.max !== undefined) {
                              if (data[i][field.name] <= field.max) {
                                item[field.name] = data[i][field.name];
                              } else {
                                item[field.name] = field.max;
                              }
                            } else {
                              item[field.name] = data[i][field.name];
                            }
                          } else {
                            item[field.name] = field.min;
                          }
                        } else {
                          item[field.name] = data[i][field.name];
                        }
                      } else {
                        const parsed = parseFloat(data[i][field.name]);
                        if (!isNaN(parsed)) {
                          item[field.name] = parsed;
                        } else {
                          item[field.name] = field.default || 0;
                        }
                      }
                    } else if (field.type === 'array') {
                      if (Array.isArray(data[i][field.name])) {
                        item[field.name] = [];
                        for (let k = 0; k < data[i][field.name].length; k++) {
                          if (field.itemType === 'string') {
                            if (options.trimStrings) {
                              item[field.name].push(String(data[i][field.name][k]).trim());
                            } else {
                              item[field.name].push(data[i][field.name][k]);
                            }
                          } else if (field.itemType === 'object') {
                            if (field.itemSchema) {
                              const nestedItem: any = {};
                              for (let l = 0; l < field.itemSchema.length; l++) {
                                const nestedField = field.itemSchema[l];
                                if (data[i][field.name][k][nestedField.name] !== undefined) {
                                  nestedItem[nestedField.name] = data[i][field.name][k][nestedField.name];
                                }
                              }
                              item[field.name].push(nestedItem);
                            }
                          }
                        }
                      }
                    }
                  } else if (field.required) {
                    if (field.default !== undefined) {
                      item[field.name] = field.default;
                    }
                  }
                }
              }
            }
            output.items.push(item);
          }
        }
      } else if (typeof data === 'object') {
        if (schema.fields) {
          for (const field of schema.fields) {
            if (data[field.name] !== undefined) {
              output[field.name] = data[field.name];
            }
          }
        }
      }
    }

    return output;
  }
}

/**
 * CHAOS: State machine from hell - Complexity: 28+
 * Switch statements inside loops inside conditions
 */
export class WorkflowEngine {
  executeWorkflow(workflow: any, context: any, events: any[]): any {
    const results: any[] = [];
    let currentState = workflow.initialState;

    if (workflow && workflow.states && events && Array.isArray(events)) {
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event && event.type) {
          const state = workflow.states[currentState];
          if (state) {
            if (state.transitions) {
              switch (event.type) {
                case 'start':
                  if (currentState === 'idle') {
                    if (context.canStart) {
                      if (event.priority === 'high') {
                        currentState = 'running_priority';
                        results.push({ event: event.type, newState: currentState });
                      } else {
                        if (context.resourcesAvailable) {
                          currentState = 'running';
                          results.push({ event: event.type, newState: currentState });
                        } else {
                          currentState = 'queued';
                          results.push({ event: event.type, newState: currentState });
                        }
                      }
                    }
                  }
                  break;
                case 'pause':
                  if (currentState === 'running' || currentState === 'running_priority') {
                    if (context.pauseAllowed) {
                      currentState = 'paused';
                      results.push({ event: event.type, newState: currentState });
                    }
                  }
                  break;
                case 'resume':
                  if (currentState === 'paused') {
                    if (context.resourcesAvailable) {
                      if (event.priority === 'high') {
                        currentState = 'running_priority';
                      } else {
                        currentState = 'running';
                      }
                      results.push({ event: event.type, newState: currentState });
                    }
                  }
                  break;
                case 'error':
                  if (currentState !== 'failed' && currentState !== 'completed') {
                    if (event.severity === 'critical') {
                      currentState = 'failed';
                      results.push({ event: event.type, newState: currentState, error: event.error });
                    } else {
                      if (context.retryEnabled) {
                        if (context.retryCount < context.maxRetries) {
                          currentState = 'retrying';
                          context.retryCount++;
                          results.push({ event: event.type, newState: currentState });
                        } else {
                          currentState = 'failed';
                          results.push({ event: event.type, newState: currentState });
                        }
                      } else {
                        currentState = 'failed';
                        results.push({ event: event.type, newState: currentState });
                      }
                    }
                  }
                  break;
                case 'complete':
                  if (currentState === 'running' || currentState === 'running_priority') {
                    if (event.validation) {
                      if (event.validation.passed) {
                        currentState = 'completed';
                        results.push({ event: event.type, newState: currentState });
                      } else {
                        if (context.strictMode) {
                          currentState = 'failed';
                          results.push({ event: event.type, newState: currentState, reason: 'validation_failed' });
                        } else {
                          currentState = 'completed_with_warnings';
                          results.push({ event: event.type, newState: currentState });
                        }
                      }
                    } else {
                      currentState = 'completed';
                      results.push({ event: event.type, newState: currentState });
                    }
                  }
                  break;
                default:
                  if (state.customHandlers && state.customHandlers[event.type]) {
                    if (context.customHandlersEnabled) {
                      results.push({ event: event.type, handled: 'custom' });
                    }
                  }
              }
            }
          }
        }
      }
    }

    return { finalState: currentState, results };
  }
}

/**
 * CATASTROPHIC: Form validator with massive complexity - Complexity: 35+
 * Every validation anti-pattern combined into one method
 */
export class FormValidator {
  validateForm(formData: any, rules: any, config: any): any {
    const errors: any = {};
    const warnings: any = {};
    let isValid = true;

    if (formData && rules && config) {
      for (const fieldName in rules) {
        if (rules.hasOwnProperty(fieldName)) {
          const fieldRules = rules[fieldName];
          const fieldValue = formData[fieldName];

          if (fieldRules.required) {
            if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
              errors[fieldName] = errors[fieldName] || [];
              errors[fieldName].push('Field is required');
              isValid = false;
            } else {
              if (fieldRules.type) {
                if (fieldRules.type === 'email') {
                  if (typeof fieldValue === 'string') {
                    if (fieldValue.includes('@')) {
                      if (fieldValue.indexOf('@') > 0 && fieldValue.indexOf('@') < fieldValue.length - 1) {
                        if (fieldValue.split('@').length === 2) {
                          const domain = fieldValue.split('@')[1];
                          if (domain.includes('.')) {
                            if (config.checkDNS) {
                              if (!config.validDomains.includes(domain)) {
                                warnings[fieldName] = warnings[fieldName] || [];
                                warnings[fieldName].push('Unknown domain');
                              }
                            }
                          } else {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Invalid email domain');
                            isValid = false;
                          }
                        } else {
                          errors[fieldName] = errors[fieldName] || [];
                          errors[fieldName].push('Multiple @ symbols');
                          isValid = false;
                        }
                      } else {
                        errors[fieldName] = errors[fieldName] || [];
                        errors[fieldName].push('Invalid @ position');
                        isValid = false;
                      }
                    } else {
                      errors[fieldName] = errors[fieldName] || [];
                      errors[fieldName].push('Email must contain @');
                      isValid = false;
                    }
                  } else {
                    errors[fieldName] = errors[fieldName] || [];
                    errors[fieldName].push('Email must be string');
                    isValid = false;
                  }
                } else if (fieldRules.type === 'phone') {
                  if (typeof fieldValue === 'string') {
                    const digits = fieldValue.replace(/\D/g, '');
                    if (digits.length >= 10) {
                      if (config.countryCode) {
                        if (config.countryCode === 'US') {
                          if (digits.length === 10 || digits.length === 11) {
                            if (digits.length === 11) {
                              if (digits[0] !== '1') {
                                errors[fieldName] = errors[fieldName] || [];
                                errors[fieldName].push('US numbers must start with 1');
                                isValid = false;
                              }
                            }
                          } else {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Invalid US phone length');
                            isValid = false;
                          }
                        } else if (config.countryCode === 'UK') {
                          if (digits.length < 10 || digits.length > 11) {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Invalid UK phone length');
                            isValid = false;
                          }
                        }
                      }
                    } else {
                      errors[fieldName] = errors[fieldName] || [];
                      errors[fieldName].push('Phone number too short');
                      isValid = false;
                    }
                  } else {
                    errors[fieldName] = errors[fieldName] || [];
                    errors[fieldName].push('Phone must be string');
                    isValid = false;
                  }
                } else if (fieldRules.type === 'password') {
                  if (typeof fieldValue === 'string') {
                    if (fieldRules.minLength) {
                      if (fieldValue.length >= fieldRules.minLength) {
                        if (fieldRules.requireUppercase) {
                          if (!/[A-Z]/.test(fieldValue)) {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Must contain uppercase');
                            isValid = false;
                          }
                        }
                        if (fieldRules.requireLowercase) {
                          if (!/[a-z]/.test(fieldValue)) {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Must contain lowercase');
                            isValid = false;
                          }
                        }
                        if (fieldRules.requireNumber) {
                          if (!/[0-9]/.test(fieldValue)) {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Must contain number');
                            isValid = false;
                          }
                        }
                        if (fieldRules.requireSpecial) {
                          if (!/[!@#$%^&*]/.test(fieldValue)) {
                            errors[fieldName] = errors[fieldName] || [];
                            errors[fieldName].push('Must contain special char');
                            isValid = false;
                          }
                        }
                      } else {
                        errors[fieldName] = errors[fieldName] || [];
                        errors[fieldName].push('Password too short');
                        isValid = false;
                      }
                    }
                  } else {
                    errors[fieldName] = errors[fieldName] || [];
                    errors[fieldName].push('Password must be string');
                    isValid = false;
                  }
                }
              }

              if (fieldRules.min !== undefined) {
                if (typeof fieldValue === 'number') {
                  if (fieldValue < fieldRules.min) {
                    errors[fieldName] = errors[fieldName] || [];
                    errors[fieldName].push(`Must be at least ${fieldRules.min}`);
                    isValid = false;
                  }
                }
              }

              if (fieldRules.max !== undefined) {
                if (typeof fieldValue === 'number') {
                  if (fieldValue > fieldRules.max) {
                    errors[fieldName] = errors[fieldName] || [];
                    errors[fieldName].push(`Must be at most ${fieldRules.max}`);
                    isValid = false;
                  }
                }
              }

              if (fieldRules.pattern) {
                if (typeof fieldValue === 'string') {
                  const regex = new RegExp(fieldRules.pattern);
                  if (!regex.test(fieldValue)) {
                    errors[fieldName] = errors[fieldName] || [];
                    errors[fieldName].push('Does not match pattern');
                    isValid = false;
                  }
                }
              }
            }
          }
        }
      }
    }

    return { isValid, errors, warnings };
  }
}
