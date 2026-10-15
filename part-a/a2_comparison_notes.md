# Part A2: Open-Source Function Comparison & Source Resolution Notes

This document compares the user's unaided first drafts with the AI explanation and the actual source truth from `cors` v2.8.6.

---

## 1. Short Function: `isOriginAllowed`

### Comparison Matrix
| Aspect | User Unaided Interpretation | AI Explanation | Actual Source Truth (`cors/lib/index.js:19-34`) | Error Verdict (User / AI / Both / Neither) |
| :--- | :--- | :--- | :--- | :--- |
| **Array Recursion** | *[Pending draft]* | Evaluates array elements recursively | Recursive call `isOriginAllowed(origin, allowedOrigin[i])` | *[Pending]* |
| **String Comparison** | *[Pending draft]* | Strict equality `===` | Strict equality `origin === allowedOrigin` | *[Pending]* |
| **RegExp Handling** | *[Pending draft]* | Executes `.test(origin)` | `allowedOrigin.test(origin)` | *[Pending]* |
| **Fallback / Boolean**| *[Pending draft]* | Coerced to boolean `!!allowedOrigin` | Double negation `!!allowedOrigin` | *[Pending]* |

---

## 2. Medium Function: `configureOrigin`

### Comparison Matrix
| Aspect | User Unaided Interpretation | AI Explanation | Actual Source Truth (`cors/lib/index.js:36-69`) | Error Verdict (User / AI / Both / Neither) |
| :--- | :--- | :--- | :--- | :--- |
| **Wildcard Origin** | *[Pending draft]* | Sets `Access-Control-Allow-Origin: *` without `Vary` | Returns single header `Access-Control-Allow-Origin: *` | *[Pending]* |
| **Static String Origin** | *[Pending draft]* | Sets origin and appends `Vary: Origin` | Sets `Access-Control-Allow-Origin: options.origin` and `Vary: Origin` | *[Pending]* |
| **Dynamic / Rejected** | *[Pending draft]* | Returns `false` or request origin with `Vary` | Returns `isAllowed ? requestOrigin : false` and `Vary: Origin` | *[Pending]* |

---

## 3. Difficult Function: `cors` (Middleware Dispatcher)

### Comparison Matrix
| Aspect | User Unaided Interpretation | AI Explanation | Actual Source Truth (`cors/lib/index.js:154-200`) | Error Verdict (User / AI / Both / Neither) |
| :--- | :--- | :--- | :--- | :--- |
| **Preflight Handling** | *[Pending draft]* | Handles `OPTIONS` by ending response or passing `preflightContinue` | Evaluates `req.method === 'OPTIONS'`, sets status code (`optionsSuccessStatus: 204`), calls `res.end()` unless `preflightContinue: true` | *[Pending]* |
| **Async Options Callback** | *[Pending draft]* | Supports dynamic options resolver via callback | Wraps in error handler and invokes `next(err)` on failure | *[Pending]* |
| **Header Mutation** | *[Pending draft]* | Writes response headers | Sets headers sequentially using `res.setHeader()` | *[Pending]* |
