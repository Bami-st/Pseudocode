/**
 * Part A2 Verification Test Runner
 *
 * Executes the ORIGINAL functions from installed `cors` (v2.8.6) in `node_modules/cors/lib/index.js`.
 * Tests native library behavior directly (no simulation or rewritten logic).
 */

'use strict';

const path = require('path');
const corsLibPath = path.resolve(__dirname, '..', 'node_modules', 'cors', 'lib', 'index.js');
const corsModule = require('cors');

// Note: cors lib/index.js is wrapped in an IIFE and exports middlewareWrapper by default.
// To access internal functions `isOriginAllowed`, `configureOrigin`, and `cors`,
// we can read the module or invoke cors with various options.

console.log('====================================================');
console.log('PART A2 NATIVE EXECUTION VERIFICATION: cors (v2.8.6)');
console.log('Target: node_modules/cors/lib/index.js');
console.log('====================================================\n');

/**
 * Creates mock req, res, and next for cors testing
 */
function createMockHttp({ method = 'GET', headers = {} } = {}) {
  const req = {
    method,
    headers: { ...headers }
  };

  const writtenHeaders = {};
  let statusCode = 200;
  let ended = false;
  let nextCalled = false;
  let nextErr = null;

  const res = {
    statusCode,
    setHeader(key, value) {
      writtenHeaders[key.toLowerCase()] = value;
    },
    getHeader(key) {
      return writtenHeaders[key.toLowerCase()];
    },
    getHeaders() {
      return { ...writtenHeaders };
    },
    end() {
      ended = true;
    }
  };

  Object.defineProperty(res, 'statusCode', {
    get() { return statusCode; },
    set(code) { statusCode = code; }
  });

  const next = (err) => {
    nextCalled = true;
    if (err) nextErr = err;
  };

  return { req, res, next, getWritten: () => writtenHeaders, isEnded: () => ended, isNextCalled: () => nextCalled, getNextErr: () => nextErr };
}

module.exports = {
  createMockHttp,
  corsModule
};

if (require.main === module) {
  console.log('[Info] Part A2 native test harness is ready.');
  console.log('[Status] Pending user submission of unaided drafts and hand-traces.\n');
}
