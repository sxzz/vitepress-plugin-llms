import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	tsconfig: './tsconfig.node.json',
	// Generate declaration file (.d.ts)
	dts: {
		// https://github.com/egoist/tsup/issues/571#issuecomment-2457920686
		compilerOptions: { composite: false },
	},
	minify: true,
	sourcemap: true,
	banner: { js: '// Built with tsup' },
	clean: true,
})
