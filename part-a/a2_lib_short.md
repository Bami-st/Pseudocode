# Part A2.1: Open-Source Function (Short) — Corrected Specification & Verification

## Library & Source Provenance
- **Library**: `cors` v2.8.6
- **Source File**: `lib/index.js` (lines 19-34)
- **Function Name**: `isOriginAllowed(origin, allowedOrigin)`

---

## Corrected Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION isOriginAllowed
INPUTS:
  origin: String or undefined, the HTTP Origin header from incoming request
  allowedOrigin: String, RegExp, Array, or Boolean, the permitted origin configuration
OUTPUT:
  isAllowed: Boolean, indicating whether the request origin is permitted
SIDE EFFECTS:
  NONE (pure boolean predicate)
FAILS WHEN:
  allowedOrigin contains nested arrays leading to excessive recursion, or RegExp throws an internal execution error

1. IF allowedOrigin is an Array:
   a. FOR EACH element in allowedOrigin:
      i. CALL isOriginAllowed recursively with origin and current element.
      ii. IF recursive call returns true:
          RETURN true immediately.
   b. RETURN false (no elements matched).
2. OTHERWISE IF allowedOrigin is a String:
   a. IF origin is strictly equal to allowedOrigin:
      RETURN true.
   b. OTHERWISE:
      RETURN false.
3. OTHERWISE IF allowedOrigin is an instance of RegExp:
   a. CALL allowedOrigin.test with origin as argument.
   b. RETURN boolean result of test.
4. OTHERWISE:
   a. COERCE allowedOrigin to boolean using double negation.
   b. RETURN coerced boolean value.
```

---

## Trace Tables & Actual Execution Comparison

| Input # | Test Case Description | Inputs (`origin`, `allowedOrigin`) | Hand-Traced Prediction | Actual Execution Result | Discrepancy / Correction Notes |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Trace 1** | Normal match in array of strings | `('https://example.com', ['https://api.com', 'https://example.com'])` | `true` | `true` | Predicted exact array iteration and early return |
| **Trace 2** | Edge case (Wildcard RegExp matching subdomain) | `('https://sub.myapp.com', /^https:\/\/.*\.myapp\.com$/)` | `true` | `true` | RegExp `.test()` evaluates pattern |
| **Trace 3** | Invalid / unhandled type (null / undefined) | `('https://evil.com', null)` | `false` | `false` | Coerced to `false` via `!!null` |
