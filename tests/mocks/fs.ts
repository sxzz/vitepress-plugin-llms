import { mock } from 'bun:test'
import { fakeMarkdownDocument } from '../resources'

/**
 * Mocked filesystem module for testing purposes
 *
 * @remarks Contains mock implementations of common `fs` operations
 */
export const mockedFs = {
	default: {
		access: mock(async () => undefined),
		mkdir: mock(),
		readFile: mock(async () => fakeMarkdownDocument),
		writeFile: mock(),
	},
}
