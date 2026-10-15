# Part A2.2: Open-Source Function (Medium) — Unaided First Draft

## Metadata & Source Reference
- **Target Function**: `configureOrigin`
- **Library**: `cors` v2.8.6
- **Source Location**: `node_modules/cors/lib/index.js` (lines 36–69)
- **Status**: PENDING UNAIDED USER SUBMISSION (Zero AI hints provided)

### Necessary Supporting Definitions (`lib/index.js:15-34`)
```javascript
function isString(s) {
  return typeof s === 'string' || s instanceof String;
}

function isOriginAllowed(origin, allowedOrigin) {
  if (Array.isArray(allowedOrigin)) {
    for (var i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) {
        return true;
      }
    }
    return false;
  } else if (isString(allowedOrigin)) {
    return origin === allowedOrigin;
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin);
  } else {
    return !!allowedOrigin;
  }
}
```

### Exact Original Function Source (`lib/index.js:36-69`)
```javascript
function configureOrigin(options, req) {
  var requestOrigin = req.headers.origin,
    headers = [],
    isAllowed;

  if (!options.origin || options.origin === '*') {
    // allow any origin
    headers.push([{
      key: 'Access-Control-Allow-Origin',
      value: '*'
    }]);
  } else if (isString(options.origin)) {
    // fixed origin
    headers.push([{
      key: 'Access-Control-Allow-Origin',
      value: options.origin
    }]);
    headers.push([{
      key: 'Vary',
      value: 'Origin'
    }]);
  } else {
    isAllowed = isOriginAllowed(requestOrigin, options.origin);
    // reflect origin
    headers.push([{
      key: 'Access-Control-Allow-Origin',
      value: isAllowed ? requestOrigin : false
    }]);
    headers.push([{
      key: 'Vary',
      value: 'Origin'
    }]);
  }

  return headers;
}
```

---

## User Unaided Draft Pseudocode
*(To be completed personally by the user without AI assistance, documentation lookup, or external explanation)*

```markdown
FUNCTION configureOrigin
INPUTS:
  options: [Type and description]
  req: [Type and description]
OUTPUT:
  [Type and description]
SIDE EFFECTS:
  [State mutations or NONE]
FAILS WHEN:
  [Failure or error conditions, if any]

1. [Step 1]
2. [Step 2]
```

---

## User Hand Traces (Before Execution)

### Trace 1: Normal Input
| Property | Value |
| :--- | :--- |
| `options.origin` | |
| `req.headers.origin` | |
| **Predicted Output (headers)** | |
| **Predicted Side Effects** | |
| **Path Traced** | |

### Trace 2: Edge Case
| Property | Value |
| :--- | :--- |
| `options.origin` | |
| `req.headers.origin` | |
| **Predicted Output (headers)** | |
| **Predicted Side Effects** | |
| **Path Traced** | |

### Trace 3: Invalid Input
| Property | Value |
| :--- | :--- |
| `options.origin` | |
| `req.headers.origin` | |
| **Predicted Output (headers)** | |
| **Predicted Side Effects** | |
| **Path Traced** | |
