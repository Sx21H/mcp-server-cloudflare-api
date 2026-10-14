import { describe, it, expect } from 'vitest'
import { truncateResponse } from '../src/truncate'

describe('truncateResponse', () => {
  it('should return string content unchanged if under limit', () => {
    const content = 'Hello, world!'
    expect(truncateResponse(content)).toBe(content)
  })

  it('should return JSON-stringified objects if under limit', () => {
    const content = { foo: 'bar', num: 42 }
    expect(truncateResponse(content)).toBe(JSON.stringify(content, null, 2))
  })

  it('should truncate long strings and add message', () => {
    // MAX_CHARS = 6000 * 4 = 24000
    const longString = 'x'.repeat(30000)
    const result = truncateResponse(longString)

    expect(result.length).toBeLessThan(longString.length)
    expect(result).toContain('--- TRUNCATED ---')
    expect(result).toContain('tokens (limit: 6,000)')
  })

  it('should truncate large objects and add message', () => {
    const largeArray = Array(5000).fill({ key: 'value', nested: { a: 1, b: 2 } })
    const result = truncateResponse(largeArray)

    expect(result).toContain('--- TRUNCATED ---')
    expect(result).toContain('Use more specific queries')
  })

  it('should not truncate content at exactly the limit', () => {
    const exactContent = 'y'.repeat(24000) // MAX_CHARS exactly
    const result = truncateResponse(exactContent)

    expect(result).toBe(exactContent)
    expect(result).not.toContain('TRUNCATED')
  })

  it('should handle empty strings', () => {
    expect(truncateResponse('')).toBe('')
  })

  it('should handle null as JSON', () => {
    expect(truncateResponse(null)).toBe('null')
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    expect(truncateResponse(arr)).toBe(JSON.stringify(arr, null, 2))
  })

  it('should truncate content one character over the limit', () => {
    const result = truncateResponse('z'.repeat(24001))

    expect(result.startsWith('z'.repeat(24000) + '\n\n--- TRUNCATED ---')).toBe(true)
    expect(result).toContain('~6,001 tokens')
  })

  it('should keep exactly the first 24000 chars and report estimated tokens', () => {
    const text = 'a'.repeat(12000) + 'b'.repeat(12000) + 'c'.repeat(40000)
    const result = truncateResponse(text)
    const [kept] = result.split('\n\n--- TRUNCATED ---')

    expect(kept).toBe(text.slice(0, 24000))
    expect(kept).not.toContain('c')
    expect(result).toContain('~16,000 tokens')
  })

  it('should not truncate a JSON value whose serialization is under the limit', () => {
    const value = { items: Array(100).fill('x') }
    expect(truncateResponse(value)).not.toContain('TRUNCATED')
  })
})
