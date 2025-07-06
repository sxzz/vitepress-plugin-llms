import { describe, expect, it } from 'bun:test'

import {
	generateLLMsFullTxt,
	// @ts-ignore
} from '../../src/generator/llms-full-txt'
import { preparedFilesSample, sampleDomain } from '../resources'

describe('generateLLMsFullTxt', () => {
	it('generates a `llms-full.txt` file', async () => {
		expect(await generateLLMsFullTxt(preparedFilesSample.slice(1), {})).toMatchSnapshot()
	})

	it('correctly attaches the domain to URLs in context', async () => {
		expect(
			await generateLLMsFullTxt(preparedFilesSample.slice(1), {
				domain: sampleDomain,
			}),
		).toMatchSnapshot()
	})
})
