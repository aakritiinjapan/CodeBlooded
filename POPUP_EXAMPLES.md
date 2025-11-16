# Horror Popup Examples

Test these code examples in separate `.ts` or `.js` files to trigger different severity popups.

## 🟨 Warning Popup (1 error)
**Creates exactly 1 syntax error**

Create a file called `warning-test.ts` and paste this:

```typescript
const message = "Hello World";
console.log(message)
undefinedVariable  // 1 error: variable not defined
```

**What happens:**
- Wait 2 seconds after typing
- Ghost animation appears (cartoonish, floating ghost)
- Duration: 3 seconds

---

## 🟧 Error Popup (2-4 errors)
**Creates 2-4 syntax errors**

Create a file called `error-test.ts` and paste this:

```typescript
const x = 5;
const y = 10;

// Multiple errors below:
print x;                    // Error 1: 'print' is not defined
print y;                    // Error 2: 'print' is not defined
console.log(undeclared);    // Error 3: 'undeclared' is not defined
```

**What happens:**
- Wait 2 seconds after typing
- Glitchy skull with red flash effect
- Duration: 4 seconds

---

## 🟥 Critical Popup (5+ errors)
**Creates 5 or more syntax errors - JUMPSCARE!**

Create a file called `critical-test.ts` and paste this:

```typescript
const a = 1;
const b = 2;
const c = 3;

// 5+ errors trigger the dead face jumpscare:
print a;              // Error 1
print b;              // Error 2  
print c;              // Error 3
invalid syntax here   // Error 4
another bad line      // Error 5
console.log(xyz);     // Error 6
foo.bar.baz();        // Error 7
```

**What happens:**
- Wait 2 seconds after typing
- **DEAD FACE JUMPSCARE** - Decaying zombie face rushes at screen!
- Hollow eyes, rotting teeth, decaying skin
- Duration: 5 seconds
- Most terrifying effect! 💀🩸

---

## 🔥 Alternative: High Complexity Code (No Errors)
**Creates complex code that triggers horror theme without errors**

Create a file called `complex-test.ts` and paste this:

```typescript
function ultraComplexFunction(data: any[]) {
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 10) {
      for (let j = 0; j < data[i]; j++) {
        if (j % 2 === 0) {
          if (j > 5) {
            for (let k = 0; k < 10; k++) {
              if (k !== j) {
                if (data[i] && data[j] && data[k]) {
                  console.log(i, j, k);
                } else {
                  throw new Error('Invalid');
                }
              }
            }
          }
        } else {
          if (j < 3) {
            continue;
          }
        }
      }
    }
  }
}
```

**What happens:**
- High cyclomatic complexity detected
- Horror theme turns crimson red
- Fog particles and blood drops appear
- Audio effects play (distorted synths)
- No popup (because no errors), but maximum visual horror!

---

## Testing Tips

1. **Create one file at a time** - Don't open multiple error files together
2. **Type the code** (don't paste) to see the effect build up
3. **Stop typing for 2+ seconds** after finishing to trigger popup
4. **Watch the status bar** - health score will drop to 0 (F) for syntax errors
5. **Check the theme** - colors change from blue → purple → orange → red
6. **Listen for audio** - Horror synths play based on complexity/errors

## Progression Test

Want to see all 3 popups in order? Follow this sequence:

1. **Start fresh**: Open a new `test.ts` file
2. **Type 1 error**: `undefinedVar` → Wait 2s → **Warning popup** 🟨
3. **Add 2 more errors**: Add `print x;` and `print y;` → Wait 2s → **Error popup** 🟧
4. **Add 3 more errors**: Add more undefined variables → Wait 2s → **Critical popup** 🟥💀

---

## What Each Popup Looks Like

### Warning (Cartoonish Ghost)
- Friendly-ish ghost face
- Floating animation
- Blue/white color scheme
- Message: "1 error(s) detected!"

### Error (Glitchy Skull)
- Skeleton skull
- Red glitch effects
- Screen shake
- Message: "2-4 error(s) detected!"

### Critical (Dead Face Jumpscare)
- Massive decaying face (800x900px)
- Rushes toward screen
- Hollow eyes, rotting teeth
- Dark, terrifying
- Message: "5+ error(s) detected!"
- **Maximum scare factor!** 😱

---

Enjoy the horror! 👻🩸☠️
