import { describe, expect, it, mock, test } from 'bun:test'

mock.module('fs', () => ({
	default: {
		readFileSync: () => '# Some cool stuff\n',
	},
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
			generateLLMsTxt(preparedFilesSample, defaultLLMsTxtTemplate),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template', () => {
		expect(
			generateLLMsTxt(
				preparedFilesSample,
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
