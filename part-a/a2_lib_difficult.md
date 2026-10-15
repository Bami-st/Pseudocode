# Part A2.3: Open-Source Function (Difficult) — Corrected Specification & Verification

## Library & Source Provenance
- **Library**: `cors` v2.8.6
- **Source File**: `lib/index.js` (lines 154-200)
- **Function Name**: `corsMiddleware(options, req, res, next)` (Express CORS middleware wrapper)

---

## Corrected Pseudocode Specification (Standard Compliance)

```markdown
FUNCTION corsMiddleware
INPUTS:
  options: Object containing CORS configuration (origin, methods, headers, preflightContinue, optionsSuccessStatus)
  req: Object representing HTTP request (method, headers)
  res: Object representing HTTP response (setHeader, statusCode, end)
  next: Function, Express callback to pass control to next middleware
OUTPUT:
  NONE
SIDE EFFECTS:
  WRITE HTTP response headers via res.setHeader; WRITE HTTP status code and call res.end() on terminating preflight requests; or CALL next() to resume middleware pipeline
FAILS WHEN:
  options callback throws an error, or res.setHeader throws due to headers already sent

1. INITIALISE headers to empty list.
2. CALL configureOrigin with options and req, and APPEND result to headers.
3. CALL configureMethods with options and req, and APPEND result to headers.
4. CALL configureCredentials with options and req, and APPEND result to headers.
5. CALL configureExposedHeaders with options and req, and APPEND result to headers.
6. CALL configureAllowedHeaders with options and req, and APPEND result to headers.
7. CALL configureMaxAge with options and req, and APPEND result to headers.
8. CALL applyHeaders with headers and res:
   FOR EACH header in headers:
     WRITE header key and value onto res via res.setHeader.
9. IF req.method is strictly equal to 'OPTIONS':
   a. IF options.preflightContinue is true:
      CALL next() and RETURN immediately.
   b. OTHERWISE:
      WRITE res.statusCode to options.optionsSuccessStatus (or 204 by default).
      WRITE res.setHeader 'Content-Length' to '0'.
      CALL res.end() to terminate HTTP response.
      RETURN immediately.
10. OTHERWISE:
    CALL next() to proceed.
    RETURN immediately.
```

---

## Trace Tables & Actual Execution Comparison

| Input # | Test Case Description | Inputs (`options`, `req`, `res`, `next`) | Hand-Traced Prediction | Actual Execution Result | Discrepancy / Correction Notes |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Trace 1** | Normal preflight `OPTIONS` request | `req.method = 'OPTIONS'`, `preflightContinue = false` | Sets CORS headers, sets status 204, calls `res.end()`, does NOT call `next()` | Headers set, status 204, `res.end()` called | Exact match |
| **Trace 2** | Standard GET request with CORS | `req.method = 'GET'` | Sets CORS headers, calls `next()` | Headers set, `next()` called | Exact match |
| **Trace 3** | Preflight with `preflightContinue = true` | `req.method = 'OPTIONS'`, `preflightContinue = true` | Sets CORS headers, does NOT end response, calls `next()` | Headers set, `next()` called, response open | Exact match |
