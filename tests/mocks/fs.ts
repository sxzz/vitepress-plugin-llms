import { mock } from 'bun:test'
import { fakeMarkdownDocument } from '../resources'

export const mockedFs = {
	default: {
		access: mock(async () => undefined),
		mkdir: mock(),
		readFile: mock(async () => fakeMarkdownDocument),
		writeFile: mock(),
	},
}
