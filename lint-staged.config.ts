import type { Configuration } from 'lint-staged'

export default {
	'*': 'bun run format --no-errors-on-unmatched',
	'src/**/*.ts': () => 'bun run lint:tsc',
} as Configuration
