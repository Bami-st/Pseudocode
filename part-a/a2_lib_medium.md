# Part A2.2: Open-Source Function (Medium) — Corrected Specification & Verification

## Library & Source Provenance
- **Library**: `cors` v2.8.6
- **Source File**: `lib/index.js` (lines 36-69)
- **Function Name**: `configureOrigin(options, req)`

---

## Corrected Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION configureOrigin
INPUTS:
  options: Object containing origin configuration property
  req: Object representing incoming HTTP request, containing headers.origin
OUTPUT:
  headers: Array of Array of Object, header tuples to set on response (each tuple containing key and value)
SIDE EFFECTS:
  NONE (pure list generator; does not write to network socket directly)
FAILS WHEN:
  req is null or undefined, or options.origin throws when evaluated

1. EXTRACT requestOrigin from req.headers.origin.
2. INITIALISE headers to empty list.
3. IF options.origin is falsy OR options.origin is equal to '*':
   APPEND tuple [{ key: 'Access-Control-Allow-Origin', value: '*' }] to headers.
4. OTHERWISE IF options.origin is a String:
   a. APPEND tuple [{ key: 'Access-Control-Allow-Origin', value: options.origin }] to headers.
   b. APPEND tuple [{ key: 'Vary', value: 'Origin' }] to headers.
5. OTHERWISE:
   a. CALL isOriginAllowed with requestOrigin and options.origin.
   b. ASSIGN boolean return value to isAllowed.
   c. IF isAllowed is true:
      ASSIGN originValue to requestOrigin.
   d. OTHERWISE:
      ASSIGN originValue to false.
   e. APPEND tuple [{ key: 'Access-Control-Allow-Origin', value: originValue }] to headers.
   f. APPEND tuple [{ key: 'Vary', value: 'Origin' }] to headers.
6. RETURN headers list.
```

---

## Trace Tables & Actual Execution Comparison

| Input # | Test Case Description | Inputs (`options`, `req`) | Hand-Traced Prediction | Actual Execution Result | Discrepancy / Correction Notes |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Trace 1** | Normal wildcard origin | `{ origin: '*' }, { headers: { origin: 'https://site.com' } }` | `[[{ key: 'Access-Control-Allow-Origin', value: '*' }]]` | `[[{ key: 'Access-Control-Allow-Origin', value: '*' }]]` | No `Vary` header emitted on wildcard |
| **Trace 2** | Specific origin string | `{ origin: 'https://app.com' }, { headers: { origin: 'https://app.com' } }` | `[[{ key: 'Access-Control-Allow-Origin', value: 'https://app.com' }], [{ key: 'Vary', value: 'Origin' }]]` | `[[{ key: 'Access-Control-Allow-Origin', value: 'https://app.com' }], [{ key: 'Vary', value: 'Origin' }]]` | Appends `Vary: Origin` |
| **Trace 3** | Dynamic list with rejected origin | `{ origin: ['https://allowed.com'] }, { headers: { origin: 'https://attacker.com' } }` | `[[{ key: 'Access-Control-Allow-Origin', value: false }], [{ key: 'Vary', value: 'Origin' }]]` | `[[{ key: 'Access-Control-Allow-Origin', value: false }], [{ key: 'Vary', value: 'Origin' }]]` | Origin value evaluates to `false` |
