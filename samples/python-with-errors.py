"""
Python file with intentional syntax errors
for testing CodeChroma error detection
"""

def missing_colon(x, y)  # ERROR: Missing colon
    return x + y


def assignment_in_condition(a, b):
    if a = b:  # ERROR: Should be ==
        return True
    return False


def mixed_tabs_spaces():
	if True:  # Tab here
        print("Mixed indentation")  # Spaces here
    return None


def wrong_print():
    print "Hello World"  # ERROR: Python 3 requires print()


def typo_else():
    x = 5
    if x > 10:
        return "big"
    esle:  # ERROR: Typo in 'else'
        return "small"


def unclosed_bracket():
    numbers = [1, 2, 3, 4  # ERROR: Missing ]
    return sum(numbers)


def unclosed_paren():
    result = calculate(5, 10  # ERROR: Missing )
    return result


def 123invalid_name():  # ERROR: Can't start with number
    return "Invalid"


class 9BadClass:  # ERROR: Class name can't start with number
    pass


def multiline_string_error():
    text = """
    This is a multiline string
    that is never closed  # ERROR: Missing closing """
    return text
