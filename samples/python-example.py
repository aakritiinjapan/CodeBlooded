"""
Python Example for CodeChroma Testing
Tests complexity analysis and syntax error detection
"""

def simple_function(x, y):
    """Low complexity function"""
    return x + y


def medium_complexity(numbers):
    """Medium complexity with some branching"""
    total = 0
    for num in numbers:
        if num > 0:
            total += num
        elif num < 0:
            total -= abs(num)
    return total


def high_complexity_function(data, threshold, mode):
    """High complexity function with nested logic"""
    results = []
    
    for item in data:
        if mode == 'strict':
            if item['value'] > threshold:
                if item['status'] == 'active':
                    if item['priority'] == 'high':
                        results.append(item)
                    elif item['priority'] == 'medium':
                        if item['age'] < 30:
                            results.append(item)
        elif mode == 'relaxed':
            if item['value'] > threshold / 2:
                results.append(item)
        else:
            results.append(item)
    
    return results


def critical_complexity_function(users, config, filters, options):
    """Critical complexity - needs refactoring!"""
    processed = []
    
    for user in users:
        if config['enabled']:
            if user['active'] and user['verified']:
                if filters['age']:
                    if user['age'] >= filters['age']['min'] and user['age'] <= filters['age']['max']:
                        if filters['location']:
                            if user['country'] in filters['location']['countries']:
                                if filters['role']:
                                    if user['role'] in filters['role']['allowed']:
                                        if options['strict']:
                                            if user['score'] >= options['minScore']:
                                                if user['lastLogin']:
                                                    days = (datetime.now() - user['lastLogin']).days
                                                    if days <= options['maxInactiveDays']:
                                                        processed.append(user)
                                        else:
                                            processed.append(user)
                                else:
                                    processed.append(user)
                        else:
                            processed.append(user)
                else:
                    processed.append(user)
    
    return processed


# Example with syntax errors (commented out to avoid breaking the file):
# def broken_function(x, y)  # Missing colon
#     return x + y

# def another_broken(a, b):
#     if a = b:  # Should be ==
#         return True

# print "Hello"  # Python 3 requires parentheses
