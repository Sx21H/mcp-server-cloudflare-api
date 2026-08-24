import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import type { HttpMethod } from '../openapi'

/**
 * Tool annotations (MCP `ToolAnnotations`) describing the behaviour of every
 * tool this server exposes.
 *
 * Annotations are hints, not guarantees — clients use them to decide whether a
 * call needs confirmation, so the safe direction is to over-report risk. Where
 * a tool's effect depends on caller-supplied input (`execute`) or on an HTTP
 * method whose semantics vary by endpoint (`post`), assume the destructive
 * case.
 */

/**
 * `search` evaluates caller-supplied JavaScript against an in-memory copy of
 * the OpenAPI spec, in an isolate created with `globalOutbound: null`. It can
 * neither mutate server state nor reach any external system, and the same code
 * over the same spec always yields the same result.
 */
export const SEARCH_ANNOTATIONS: ToolAnnotations = {
  title: 'Search the Cloudflare OpenAPI spec',
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false
}

/**
 * `execute` runs caller-supplied JavaScript against the live Cloudflare API, so
 * a single call can create, replace or delete real resources, and its result
 * depends on the current state of the account.
 */
export const EXECUTE_ANNOTATIONS: ToolAnnotations = {
  title: 'Execute code against the Cloudflare API',
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true
}

/**
 * `docs` is a read-only semantic search over the Cloudflare developer docs
 * index, which is external to this server and updated independently.
 */
export const DOCS_ANNOTATIONS: ToolAnnotations = {
  title: 'Search the Cloudflare documentation',
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: true
}

/**
 * Annotations for a generated non-Code-Mode tool, derived from the HTTP method
 * of the endpoint it wraps. Every generated tool calls the Cloudflare API, so
 * `openWorldHint` is always true.
 *
 * - `get` is a pure read.
 * - `put` and `delete` replace or remove a resource, but repeating the call
 *   leaves the account in the same state.
 * - `patch` modifies existing state and is not guaranteed to be repeatable.
 * - `post` is treated as destructive: Cloudflare uses it both for creation and
 *   for irreversible actions such as cache purges and rollbacks, and the method
 *   alone cannot tell them apart.
 */
export function annotationsForMethod(method: HttpMethod): ToolAnnotations {
  if (method === 'get') {
    return { readOnlyHint: true, idempotentHint: true, openWorldHint: true }
  }

  return {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: method === 'put' || method === 'delete',
    openWorldHint: true
  }
}
