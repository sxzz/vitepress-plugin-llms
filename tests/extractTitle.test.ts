import { describe, expect, it } from 'bun:test'
// @ts-ignore
import { extractTitle } from '../src/helpers'

describe('extractTitle', () => {
	it('extracts title from frontmatter hero.name', () => {
		const markdown = `---
hero:
  name: My Awesome Title
---
# Some Heading
Content goes here`

		expect(extractTitle(markdown)).toBe('My Awesome Title')
	})

	it('extracts title from markdown heading when no frontmatter `hero.name` exists', () => {
		const markdown = '# My Markdown Title\nSome content here'

		expect(extractTitle(markdown)).toBe('My Markdown Title')
	})

	it('extracts title from markdown heading when frontmatter exists but has no `hero.name`', () => {
		const markdown = `---
description: Some description
author: John Doe
---
# Title From Heading
Content goes here`

		expect(extractTitle(markdown)).toBe('Title From Heading')
	})

	it('returns `undefined` when no frontmatter `hero.name` or markdown title exists', () => {
		const markdown = 'Some content without any headings or frontmatter'

		expect(extractTitle(markdown)).toBeUndefined()
	})
})
