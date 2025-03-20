import type { UserConfig } from 'vite'

export interface LlmstxtSettings {
	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file
	 *
	 * @default true
	 */
	generateLLMsFullTxt?: boolean
	/**
	 * Determines whether to generate the `llms.txt` which contains a list of sections with links
	 *
	 * @default true
	 */
	generateLLMsTxt?: boolean
	/**
	 * An array of strings representing file paths to be ignored
	 *
	 * Useful if you want to exclude certain files from LLMs (e.g. files that are not related to documentation - sponsors, team, etc.)
	 *
	 * @example
	 * llmstxt({
	 *     ignoreFiles: [
	 *         'about/team/*',
	 *         'sponsor/*
	 *         // ...
	 *     ]
	 * })
	 *
	 * @default []
	 */
	ignoreFiles?: string[]
	/**
	 * Custom template for `llms.txt` file, useful if you want to make your own order of elements
	 *
	 * List of available template elements:
	 *
	 * - `{title}` - Title taken from frontmater or from the first h1 heading in the main document (`index.md`)
	 * - `{description}` - Description taken from `hero.tagline`
	 * - `{toc}` - Automatically generated **T**able **O**f **C**ontents
	 *
	 * @default
	 * `# {title}

	 {description}

	 ## Table of Contents

	 {toc}`
	 */
	customLLMsTxtTemplate?: string
	/**
	 * Folder from which files will be processed
	 *
	 * Useful if you want to configure the plugin to generate documentation for LLMs in only one language
	 *
	 * @example
	 * llmstxt({
	 *     // Generate documentation for LLMs from English documentation only
	 *     workDir: 'en'
	 * })
	 * @default vitepress.srcDir
	 */
	workDir?: string
}

/**
 * Represents a prepared file with its title and path.
 */
export type PreparedFile = {
	/**
	 * The title of the file
	 *
	 * @example 'Guide'
	 */
	title: string

	/**
	 * The absolute path to the file
	 *
	 * @example 'guide/getting-started.md'
	 */
	path: string
}

/**
 * Configuration interface for VitePress, extending the UserConfig from Vite.
 */
interface VitePressConfig extends UserConfig {
	/** The **VitePress** configuration */
	vitepress: {
		/** The source directory */
		srcDir: string
		/** The directory where the output files will be generated */
		outDir: string
	}
}
