# Part A2.3: Open-Source Function (Difficult) — Unaided First Draft

## Metadata & Source Reference
- **Target Function**: `cors` (Core middleware logic)
- **Library**: `cors` v2.8.6
- **Source Location**: `node_modules/cors/lib/index.js` (lines 154–192)
- **Status**: PENDING UNAIDED USER SUBMISSION (Zero AI hints provided)

### Necessary Supporting Definitions (`lib/index.js`)
```javascript
// Defaults (lines 8-13)
var defaults = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// applyHeaders (lines 142-152)
function applyHeaders(headers, res) {
  for (var i = 0, n = headers.length; i < n; i++) {
    var header = headers[i];
    if (header) {
      if (Array.isArray(header)) {
        applyHeaders(header, res);
      } else if (header.key === 'Vary' && header.value) {
        vary(res, header.value);
      } else if (header.value) {
        res.setHeader(header.key, header.value);
      }
    }
  }
}
```

### Exact Original Function Source (`lib/index.js:154-192`)
```javascript
function cors(options, req, res, next) {
  var headers = [],
    method = req.method && req.method.toUpperCase && req.method.toUpperCase();

  if (method === 'OPTIONS') {
    // preflight
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options));
    headers.push(configureMethods(options));
    headers.push(configureAllowedHeaders(options, req));
    headers.push(configureMaxAge(options));
    headers.push(configureExposedHeaders(options));
    applyHeaders(headers, res);

    if (options.preflightContinue) {
      next();
    } else {
      // Safari (and potentially other browsers) need content-length 0,
      //   for 204 or they just hang waiting for a body
      res.statusCode = options.optionsSuccessStatus;
      res.setHeader('Content-Length', '0');
      res.end();
    }
  } else {
    // actual response
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options));
    headers.push(configureExposedHeaders(options));
    applyHeaders(headers, res);
    next();
  }
}
```

---

## User Unaided Draft Pseudocode
*(To be completed personally by the user without AI assistance, documentation lookup, or external explanation)*

```markdown
FUNCTION cors
INPUTS:
  options: [Type and description]
  req: [Type and description]
  res: [Type and description]
  next: [Type and description]
OUTPUT:
  [Type and description]
SIDE EFFECTS:
  [HTTP response mutations, headers, ending responses, next() calls]
FAILS WHEN:
  [Failure or error conditions, if any]

1. [Step 1]
2. [Step 2]
```

---

## User Hand Traces (Before Execution)

### Trace 1: Normal Input (Standard Preflight OPTIONS)
| Property | Value |
| :--- | :--- |
| `req.method` | `'OPTIONS'` |
| `options.preflightContinue` | `false` |
| `options.optionsSuccessStatus` | `204` |
| **Predicted Flow & Calls** | |
| **Predicted Status Code** | |
| **Predicted Headers Written** | |
| **Path Traced** | |

### Trace 2: Edge Case (Actual GET Request)
| Property | Value |
| :--- | :--- |
| `req.method` | `'GET'` |
| `options.preflightContinue` | `false` |
| **Predicted Flow & Calls** | |
| **Predicted Status Code** | |
| **Predicted Headers Written** | |
| **Path Traced** | |

### Trace 3: Boundary / Custom Input (`preflightContinue = true`)
| Property | Value |
| :--- | :--- |
| `req.method` | `'OPTIONS'` |
| `options.preflightContinue` | `true` |
| **Predicted Flow & Calls** | |
| **Predicted Status Code** | |
| **Predicted Headers Written** | |
| **Path Traced** | |
