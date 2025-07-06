import { describe, expect, it } from 'bun:test'
import matter from 'gray-matter'
import { cleanUrl, extractTitle } from '../../src/utils/file-utils'

const fakeIndexMd = matter(`\
---
title: My Awesome Title
---

# Some Heading

Content goes here`)

const fakeIndexMdWithoutTitle = matter(`\
---
description: Some description
author: John Doe
---

# Title From Heading

Content goes here`)

describe('extractTitle', () => {
	it('extracts title from frontmatter', () => {
		expect(extractTitle(fakeIndexMd)).toBe('My Awesome Title')
	})

	it('extracts title from markdown heading when no frontmatter exists', () => {
		const markdown = matter('# My Markdown Title\nSome content here')
		expect(extractTitle(markdown)).toBe('My Markdown Title')
	})

	it('extracts title from markdown heading when frontmatter exists but has no title', () => {
		expect(extractTitle(fakeIndexMdWithoutTitle)).toBe('Title From Heading')
	})

	it('returns `undefined` when no frontmatter or markdown title exists', () => {
		const markdown = matter('Some content without any headings or frontmatter')
		expect(extractTitle(markdown)).toBeUndefined()
	})
})
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
