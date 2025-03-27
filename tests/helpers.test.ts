import { describe, expect, it, mock, test } from 'bun:test'
import matter from 'gray-matter'
import {
	fakeCustomLlmsTxtTemplate,
	fakeIndexMd,
	fakeGettingStartedMd,
	fakeQuickstartMd,
	fakeMarkdownDocument,
} from './resources'

const srcDir = 'docs'

const readFileSync = mock((path) =>
	path === `${srcDir}/index.md` ? fakeIndexMd : fakeMarkdownDocument,
)

mock.module('node:fs', () => ({
	default: { readFileSync },
	readFileSync,
}))

import {
	replaceTemplateVariable,
	expandTemplate,
	generateLLMsFullTxt,
	generateLLMsTxt,
	generateTOC,
	// @ts-ignore
} from '../src/helpers'

import type { PreparedFile, VitePressConfig } from '../src/types'
// @ts-ignore
import { defaultLLMsTxtTemplate } from '../src/constants'

const preparedFilesSample: PreparedFile[] = [
	{
		title: 'Some cool tool',
		path: `${srcDir}/index.md`,
		file: matter(fakeIndexMd),
	},
	{
		title: 'Getting started',
		path: `${srcDir}/test/getting-started.md`,
		file: matter(fakeGettingStartedMd),
	},
	{
		title: 'Quickstart',
		path: `${srcDir}/test/quickstart.md`,
		file: matter(fakeQuickstartMd),
	},
	{
		title: 'Some other section',
		path: `${srcDir}/test/other.md`,
		file: matter(fakeMarkdownDocument),
	},
]

describe('replaceTemplateVariable', () => {
	it('replaces a single template variable', () => {
		const result = replaceTemplateVariable('Hello {name}!', 'name', 'Alice')
		expect(result).toBe('Hello Alice!')
	})

	it('uses fallback value when main value is empty', () => {
		const result = replaceTemplateVariable('Hello {name}!', 'name', '', 'User')
		expect(result).toBe('Hello User!')
	})

	it('removes variable if both value and fallback are empty', () => {
		const result = replaceTemplateVariable('Hello {name}!', 'name', '', '')
		expect(result).toBe('Hello !')
	})

	it('preserves extra new lines before variable', () => {
		const result = replaceTemplateVariable('Hello\n\n{name}!', 'name', 'Alice')
		expect(result).toBe('Hello\n\nAlice!')
	})
})

describe('expandTemplate', () => {
	it('replaces multiple template variables', () => {
		const template = 'Hello {name}, welcome to {place}!'
		const values = { name: 'Alice', place: 'Wonderland' }
		const result = expandTemplate(template, values)
		expect(result).toBe('Hello Alice, welcome to Wonderland!')
	})

	it('does not touch unused template variables', () => {
		const template = 'Hello {name}, welcome to {place}!'
		const values = { name: 'Alice' }
		const result = expandTemplate(template, values)
		expect(result).toBe('Hello Alice, welcome to {place}!')
	})
})

describe('generateTOC', () => {
	it('generates a table of contents', () => {
		expect(generateTOC(preparedFilesSample.slice(1), srcDir)).toBe(
			'- [Getting started](/test/getting-started.md): Instructions on how to get started with the tool\n- [Quickstart](/test/quickstart.md): Instructions for quick project initialization\n- [Some other section](/test/other.md)\n',
		)
	})
})

describe('generateLLMsTxt', () => {
	it('generates a `llms.txt` file', () => {
		expect(
			generateLLMsTxt(
				preparedFilesSample.slice(1),
				`${srcDir}/index.md`,
				{} as VitePressConfig,
				srcDir,
				defaultLLMsTxtTemplate,
			),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template', () => {
		expect(
			generateLLMsTxt(
				preparedFilesSample.slice(1),
				`${srcDir}/index.md`,
				{} as VitePressConfig,
				srcDir,
				fakeCustomLlmsTxtTemplate,
			),
		).toMatchSnapshot()
	})
	it('works correctly with a custom template variables', () => {
		expect(
			generateLLMsTxt(
				preparedFilesSample,
				`${srcDir}/index.md`,
				{} as VitePressConfig,
				srcDir,
				defaultLLMsTxtTemplate,
				{ title: 'foo', description: 'bar', toc: 'zoo' },
			),
		).toMatchSnapshot()
	})

	it('works correctly with a custom template and variables', () => {
		expect(
			generateLLMsTxt(
				preparedFilesSample,
				`${srcDir}/index.md`,
				{} as VitePressConfig,
				srcDir,
				'# {foo}\n\n**{bar}**\n\n{zoo}',
				{ title: 'foo', description: 'bar', toc: 'zoo' },
			),
		).toMatchSnapshot()
	})
})

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', () => {
		expect(
			generateLLMsFullTxt(preparedFilesSample.slice(1), srcDir),
		).toMatchSnapshot()
	})
})
