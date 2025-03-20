import { describe, expect, it, mock, test } from 'bun:test'

const readFileSync = mock((path) => {
	if (path === 'index.md') {
		return `---
title: My Site
description: A cool site
---
# Welcome
Content goes here`
	}
	return '# Some cool stuff'
})

mock.module('node:fs', () => ({
	default: {
		readFileSync,
	},
	readFileSync,
}))

import {
	generateLLMsFullTxt,
	generateLLMsTxt,
	generateTOC,
	// @ts-ignore
} from '../src/helpers'

import type { PreparedFile } from '../src/types'
// @ts-ignore
import { defaultLLMsTxtTemplate } from '../src/constants'

const preparedFilesSample: PreparedFile[] = [
	{
		title: 'My Title',
		path: 'index.md',
	},
	{
		title: 'My Title 2',
		path: 'test/test.md',
	},
]

describe('generateTOC', () => {
	it('generates a table of contents', () => {
		expect(generateTOC(preparedFilesSample)).toBe(`\
- [My Title](/index.md)
- [My Title 2](/test/test.md)\n`)
	})
})

describe('generateLLMsTxt', () => {
	it('generates a `llms.txt` file', () => {
		expect(
			generateLLMsTxt(preparedFilesSample, 'index.md', defaultLLMsTxtTemplate),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template', () => {
		expect(
			generateLLMsTxt(
				preparedFilesSample,
				'index.md',
				`\
# Custom title

> Custom description

## TOC

{toc}`,
			),
		).toMatchSnapshot()
	})
})

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', () => {
		expect(generateLLMsFullTxt(preparedFilesSample)).toMatchSnapshot()
	})
})
