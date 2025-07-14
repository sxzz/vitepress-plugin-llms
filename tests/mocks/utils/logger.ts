import { mock } from 'bun:test'
// @ts-ignore
import logger from '@/utils/logger'

/** Mocked {@link logger} for silencing logs in tests. */
export const mockedLogger = {
	default: {
		info: mock(),
		success: mock(),
		warn: mock(),
		error: mock(),
	},
}

export default mockedLogger
