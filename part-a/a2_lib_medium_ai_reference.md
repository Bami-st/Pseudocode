FUNCTION configureOrigin

INPUTS:
- options: Configuration object containing an origin policy.
- req: Request object containing headers and an optional origin header.

OUTPUT:
- An array of header groups, each containing header-description objects with key and value fields.

SIDE EFFECTS:
- No response headers are written directly.
- Delegated matching with global or sticky regular expressions may change their lastIndex.

FAILS WHEN:
- Required objects cannot be accessed, such as null options or missing req.headers.
- Delegated origin matching throws or exceeds the recursion limit.

1. Read the request origin from the request headers.
2. Create an empty collection of header groups.
3. IF the configured origin is falsy or equals the wildcard string:
   1. Add a header group specifying Access-Control-Allow-Origin with value "*".
4. OTHERWISE, IF the configured origin is a primitive string or String object:
   1. Add a header group specifying Access-Control-Allow-Origin with the configured value.
   2. Add a header group specifying Vary with value "Origin".
5. OTHERWISE:
   1. CALL isOriginAllowed with the request origin and configured origin policy.
   2. IF allowed:
      1. Add Access-Control-Allow-Origin with the request origin.
   3. OTHERWISE:
      1. Add Access-Control-Allow-Origin with value false.
   4. Add Vary with value "Origin".
6. RETURN the collection of header groups.

HAND TRACE 1 — Fixed origin

Inputs:
- options.origin: "https://trusted.example".
- req.headers.origin: "https://different.example".

Path:
1. Read the request origin.
2. Create the empty collection.
3. Skip the wildcard branch.
4. Take the string branch.
5. Add the configured origin and Vary header groups.
6. Return the collection.

Predicted output:
[
  [{"key":"Access-Control-Allow-Origin","value":"https://trusted.example"}], 

> [Editor note: the pasted submission ends here, mid-array. Traces 2 and 3 were not received.]
