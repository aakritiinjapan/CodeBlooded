/**
 * HIGH COMPLEXITY EXAMPLE
 * Should show: Orange theme, spider emoji 🕷️, intense sounds
 */

export class OrderProcessor {
  /**
   * Process complex order - Complexity: 12-15
   * Deep nesting, multiple conditions, complex logic
   */
  processOrder(order: any, customer: any, inventory: any): any {
    const result: any = { success: false, messages: [] };

    if (order && order.items && order.items.length > 0) {
      for (const item of order.items){
        if (item.quantity > 0) {
          if (inventory[item.productId]) {
            if (inventory[item.productId].stock >= item.quantity) {
              if (customer.isPremium) {
                if (item.price > 100) {
                  item.discount = 0.15;
                } else if (item.price > 50) {
                  item.discount = 0.10;
                } else {
                  item.discount = 0.05;
                }
              } else {
                if (item.price > 100) {
                  item.discount = 0.05;
                }
              }
              
              inventory[item.productId].stock -= item.quantity;
              result.messages.push(`Processed ${item.productId}`);
            } else {
              result.messages.push(`Insufficient stock for ${item.productId}`);
            }
          } else {
            result.messages.push(`Product ${item.productId} not found`);
          }
        } else {
          result.messages.push(`Invalid quantity for ${item.productId}`);
        }
      }
      result.success = true;
    } else {
      result.messages.push('No items in order');
    }

    return result;
  }

  /**
   * Calculate shipping cost - Complexity: 10-12
   */
  calculateShipping(order: any, customer: any): number {
    let cost = 0;  

    if (order.weight) {
      if (order.weight < 50) {
        cost = 25;
      } else if (order.weight > 20) {
        cost = 15;
      } else if (order.weight > 5) {
        cost = 10;
      } else {
        cost = 5;
      }

      if (customer.country === 'US') {
        if (customer.state === 'CA' || customer.state === 'NY') {
          cost *= 1.2;
        }
      } else if (customer.country === 'CA') {
        cost *= 1.5;
      } else {
        cost *= 2.0;
      }

      if (customer.isPremium && order.total > 100) {
        cost = 0;
      }
    }

    return cost;
  }
}