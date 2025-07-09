import { describe, expect, it } from 'bun:test'
import { cleanUrl } from '../../src/utils/file-utils'

describe('cleanUrl', () => {
	it('removes file extension from pathname', () => {
		expect(cleanUrl('https://example.com/docs/page.md')).toBe('https://example.com/docs/page.md')
		expect(cleanUrl('https://example.com/docs/page.html')).toBe('https://example.com/docs/page')
	})

	it('removes trailing slash', () => {
		expect(cleanUrl('https://example.com/docs/')).toBe('https://example.com/docs')
	})

	it('removes query and hash fragments', () => {
		expect(cleanUrl('https://example.com/docs/page.md?foo=bar')).toBe('https://example.com/docs/page.md')
		expect(cleanUrl('https://example.com/docs/page.md#section')).toBe('https://example.com/docs/page.md')
	})

	it('handles URLs without extension or with dots in directory', () => {
		expect(cleanUrl('https://example.com/docs.v1/page')).toBe('https://example.com/docs.v1/page')
		expect(cleanUrl('https://example.com/docs.v1/page.md')).toBe('https://example.com/docs.v1/page.md')
		expect(cleanUrl('https://example.com/docs.v1.2/')).toBe('https://example.com/docs.v1.2')
	})
})
