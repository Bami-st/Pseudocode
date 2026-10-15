# isOriginAllowed — AI-generated reference

**Provenance:** Based on the cors source supplied in this conversation. This document is AI-generated and must not be presented as an unaided first draft.

FUNCTION isOriginAllowed

INPUTS:
- origin: Usually a string identifying the request’s origin.
- allowedOrigin: An array of allowed values, a string, a regular expression, or another JavaScript value.

OUTPUT:
- Boolean indicating whether the supplied origin is allowed.

SIDE EFFECTS:
- Normally NONE.
- Testing a global or sticky regular expression can change that expression’s lastIndex property.

FAILS WHEN:
- Nested arrays cause excessive recursion, including a circular array that recursively contains itself.
- A called regular-expression test or value conversion throws.
- The function does not explicitly reject unexpected input types.

1. IF allowedOrigin is an array:
   1. FOR EACH entry in the array, in order:
      1. CALL isOriginAllowed with the same origin and the current entry.
      2. IF that call returns true:
         1. RETURN true immediately.
   2. END FOR when a matching entry is found or all entries have been examined.
   3. RETURN false if no entry matched.
2. OTHERWISE, IF allowedOrigin is a primitive string or a String object:
   1. Compare origin and allowedOrigin using strict equality, without converting either value.
   2. RETURN the comparison result.
3. OTHERWISE, IF allowedOrigin is a regular expression:
   1. CALL the expression’s test operation with origin.
   2. RETURN its Boolean result.
4. OTHERWISE:
   1. Convert allowedOrigin to its Boolean truth value.
   2. RETURN that Boolean.

## Hand trace 1 — Normal array input

Inputs:
- origin: "https://shop.example"
- allowedOrigin: ["https://admin.example", "https://shop.example"]

| Step | Prediction |
|---|---|
| 1 | allowedOrigin is an array, so inspect entries in order. |
| 1.1 | Call the function with the first entry. |
| 2 | The first entry is a string; strict equality is false. |
| 1.1 | Continue with the second entry. |
| 2 | The second entry is a string; strict equality is true. |
| 1.1.2 | Return true immediately from the outer call. |

Predicted output: true.

Predicted side effects: none.

## Hand trace 2 — Regular-expression branch

Inputs:
- origin: "https://shop.example"
- allowedOrigin: /^https:\/\/[a-z]+\.example$/
- The expression has neither the global nor sticky flag.

| Step | Prediction |
|---|---|
| 1 | The allowed value is not an array. |
| 2 | It is not a string. |
| 3 | It is a regular expression. |
| 3.1 | Test the origin against the expression. |
| 3.2 | Return true because the origin matches. |

Predicted output: true.

Predicted side effects: no lastIndex change for this non-global, non-sticky expression.

## Hand trace 3 — Unexpected null input

Inputs:
- origin: "https://shop.example"
- allowedOrigin: null

| Step | Prediction |
|---|---|
| 1 | null is not an array. |
| 2 | null is not a string. |
| 3 | null is not a regular expression. |
| 4 | Convert null to its Boolean truth value. |
| 4.2 | Return false. |

Predicted output: false.

Predicted side effects: none.

Observation: null does not cause a validation error; it follows the fallback branch.
