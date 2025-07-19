import type { Configuration } from 'lint-staged'

export default {
	'*': ['bun run format --no-errors-on-unmatched', 'cspell --no-error-on-empty'],
	'src/**/*.ts': () => 'bun run lint:tsc',
} as Configuration
