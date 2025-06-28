import { describe, expect, it } from 'bun:test'

// @ts-ignore
import { generateLLMsFullTxt } from '../../src/generator'
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
