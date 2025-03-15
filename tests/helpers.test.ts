import { describe, expect, test } from 'bun:test'
// @ts-ignore
import { extractTitle, stripExt } from '../src/helpers'

describe('extractTitle', () => {
	test('extracts title from h1 heading', () => {
		const content = '# My Title\nSome content'
		expect(extractTitle(content)).toBe('My Title')
	})

	test.todo('extracts first line when no h1 heading', () => {
		const content = 'First Line\nSecond Line'
		expect(extractTitle(content)).toBe('First Line')
	})

	test.todo('skips frontmatter when looking for content', () => {
		const content = '---\ntitle: Metadata\n---\nActual Content'
		expect(extractTitle(content)).toBe('Actual Content')
	})

	test.todo('truncates long lines to 50 characters', () => {
		const longLine =
			'This is a very long line that should be truncated at fifty characters'
		expect(extractTitle(longLine)).toBe(
			'This is a very long line that should be truncated at f...',
		)
	})

	test('returns default when no content found', () => {
		expect(extractTitle('')).toBe('Untitled section')
	})
})
