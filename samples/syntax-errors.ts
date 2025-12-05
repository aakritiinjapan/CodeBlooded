/**
 * This file intentionally contains syntax errors
 * Used to test error handling in the parser
 * codeblooded should gracefully handle these errors and report them
 */

// ERROR 1: Missing closing brace
export function missingBrace() {
  if (true) {
    console.log('missing closing brace');
  // Missing }

// ERROR 2: Unclosed string
export function unclosedString() {
  const message = "This string is not closed;
  return message;
}

// ERROR 3: Invalid syntax
export function invalidSyntax() {
  const x = ;
  return x;
}

// ERROR 4: Missing parenthesis
export function missingParen() {
  if true {
    return 'missing parenthesis';
  }
}

// ERROR 5: Invalid arrow function
export const invalidArrow = => {
  return 'invalid';
};

// ERROR 6: Unexpected token
export function unexpectedToken() {
  return ;;
}

// ERROR 7: Invalid type annotation
export function invalidType(x: ): number {
  return x;
}

// ERROR 8: Unclosed comment
export function unclosedComment() {
  /* This comment is not closed
  return 'test';
}

// ERROR 9: Invalid destructuring
export function invalidDestructure({): void {
  console.log('invalid');
}

// ERROR 10: Missing comma in object
export function missingComma() {
  const obj = {
    a: 1
    b: 2
  };
  return obj;
}
