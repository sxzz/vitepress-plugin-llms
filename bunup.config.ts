import { defineConfig } from 'bunup'
// @ts-ignore
import { report } from 'bunup/plugins'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	// Generate declaration file (.d.ts)
	dts: true,
	minify: false,
	// 🩼
	// Currently, this is the only way to externalize all packages.
	// https://www.npmjs.com/package/package-name-regex
	external: [/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/],
	banner: '// Built with bunup',
	clean: true,
	plugins: [report()],
})
