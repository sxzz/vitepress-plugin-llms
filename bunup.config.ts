import { defineConfig } from 'bunup'
// @ts-expect-error
import { copy } from 'bunup/plugins'

export default defineConfig({
	entry: ['src/index.ts', 'src/vitepress-components/utils.ts'],
	format: ['esm'],
	// Generate declaration file (`.d.ts`)
	dts: {
		entry: ['src/index.ts'],
		splitting: true,
	},
	minify: false,
	banner: '// Built with bunup',
	clean: true,
	plugins: [copy(['src/vitepress-components/*.vue'], 'dist/vitepress-components')],
})
