# Part A2.1: Open-Source Function (Short) — Unaided First Draft

## Metadata & Source Reference
- **Target Function**: `isOriginAllowed`
- **Library**: `cors` v2.8.6
- **Source Location**: `node_modules/cors/lib/index.js` (lines 19–34)
- **Status**: PENDING UNAIDED USER SUBMISSION (Zero AI hints provided)

### Necessary Supporting Definition (`lib/index.js:15-17`)
```javascript
function isString(s) {
  return typeof s === 'string' || s instanceof String;
}
```

### Exact Original Function Source (`lib/index.js:19-34`)
```javascript
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

---

## User Unaided Draft Pseudocode
*(To be completed personally by the user without AI assistance, documentation lookup, or external explanation)*

```markdown
FUNCTION isOriginAllowed
INPUTS:
  origin: [Type and description]
  allowedOrigin: [Type and description]
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
| `origin` | |
| `allowedOrigin` | |
| **Predicted Output** | |
| **Predicted Side Effects** | |
| **Path Traced** | |

### Trace 2: Edge Case
| Property | Value |
| :--- | :--- |
| `origin` | |
| `allowedOrigin` | |
| **Predicted Output** | |
| **Predicted Side Effects** | |
| **Path Traced** | |

### Trace 3: Invalid Input
| Property | Value |
| :--- | :--- |
| `origin` | |
| `allowedOrigin` | |
| **Predicted Output** | |
| **Predicted Side Effects** | |
| **Path Traced** | |
