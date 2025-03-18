import { describe, expect, it, mock, test } from 'bun:test'

mock.module('fs', () => ({
	default: {
		readFileSync: () => '# Hello\n',
	},
}))

import {
	extractTitle,
	generateLLMsFullTxt,
	generateLLMsTxt,
	generateTOC,
	// @ts-ignore
} from '../src/helpers'

import type { PreparedFile } from '../src/types'

const preparedFilesSample: PreparedFile[] = [
	{
		title: 'My Title',
		path: 'test.md',
	},
	{
		title: 'My Title 2',
		path: 'test/test.md',
	},
]

describe('generateTOC', () => {
	it('generates a table of contents', () => {
		expect(generateTOC(preparedFilesSample)).toBe(`\
- [My Title](/test.md)
- [My Title 2](/test/test.md)\n`)
	})
})

describe('generateLLMsTxt', () => {
	it('generates a `llms.txt` file', () => {
		expect(generateLLMsTxt(preparedFilesSample)).toMatchSnapshot()
	})
})

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', () => {
		expect(generateLLMsFullTxt(preparedFilesSample)).toMatchSnapshot()
	})
})

describe('extractTitle', () => {
	it('extracts title from h1 heading', () => {
		const content = '# My Title\nSome content'
		expect(extractTitle(content)).toBe('My Title')
	})

	it('extracts first line when no h1 heading', () => {
		const content = 'First Line\nSecond Line'
		expect(extractTitle(content)).toBe('First Line')
	})

	test.todo('skips frontmatter when looking for content', () => {
		const content = '---\ntitle: Metadata\n---\nActual Content'
		expect(extractTitle(content)).toBe('Actual Content')
	})

	it('returns default when no content found', () => {
		expect(extractTitle('')).toBe('Untitled section')
	})
})
