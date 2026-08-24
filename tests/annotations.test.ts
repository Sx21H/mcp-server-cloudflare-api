import { describe, expect, it } from 'vitest'
import {
  DOCS_ANNOTATIONS,
  EXECUTE_ANNOTATIONS,
  SEARCH_ANNOTATIONS,
  annotationsForMethod
} from '../src/tools/annotations'
import type { HttpMethod } from '../src/openapi'

describe('annotationsForMethod', () => {
  it('marks GET as a read-only, idempotent call', () => {
    expect(annotationsForMethod('get')).toEqual({
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true
    })
  })

  it.each<[HttpMethod, boolean]>([
    ['put', true],
    ['delete', true],
    ['post', false],
    ['patch', false]
  ])('marks %s as destructive with idempotentHint=%s', (method, idempotent) => {
    expect(annotationsForMethod(method)).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: idempotent,
      openWorldHint: true
    })
  })

  it('never reports a write method as read-only', () => {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      expect(annotationsForMethod(method).readOnlyHint).toBe(false)
    }
  })

  it('always reports generated tools as reaching an external system', () => {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      expect(annotationsForMethod(method).openWorldHint).toBe(true)
    }
  })
})

describe('Code-Mode tool annotations', () => {
  it('reports search as sandboxed and read-only', () => {
    expect(SEARCH_ANNOTATIONS.readOnlyHint).toBe(true)
    expect(SEARCH_ANNOTATIONS.idempotentHint).toBe(true)
    // The search isolate is created with `globalOutbound: null`.
    expect(SEARCH_ANNOTATIONS.openWorldHint).toBe(false)
  })

  it('reports execute as a destructive, open-world call', () => {
    expect(EXECUTE_ANNOTATIONS.readOnlyHint).toBe(false)
    expect(EXECUTE_ANNOTATIONS.destructiveHint).toBe(true)
    expect(EXECUTE_ANNOTATIONS.idempotentHint).toBe(false)
    expect(EXECUTE_ANNOTATIONS.openWorldHint).toBe(true)
  })

  it('reports docs as a read-only lookup against an external index', () => {
    expect(DOCS_ANNOTATIONS.readOnlyHint).toBe(true)
    expect(DOCS_ANNOTATIONS.openWorldHint).toBe(true)
  })

  it('gives every first-class tool a human-readable title', () => {
    for (const annotations of [SEARCH_ANNOTATIONS, EXECUTE_ANNOTATIONS, DOCS_ANNOTATIONS]) {
      expect(annotations.title).toBeTruthy()
    }
  })
})
