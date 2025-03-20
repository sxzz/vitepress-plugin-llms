import type { UserConfig } from 'vite'

export interface LlmstxtSettings {
	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file
	 *
	 * @default true
	 */
	generateLLMsFullTxt?: boolean

	/**
	 * Indicates whether to generate the `llms.txt` file, which contains a list of sections with corresponding links.
	 *
	 * @default true
	 */
	generateLLMsTxt?: boolean

	/**
	 * An array of file path patterns to be ignored during processing.
	 *
	 * This is useful for excluding certain files from LLMs, such as those not related to documentation (e.g., sponsors, team, etc.).
	 *
	 * @example
	 * llmstxt({
	 *     ignoreFiles: [
	 *         'about/team/*',
	 *         'sponsor/*'
	 *         // ...
	 *     ]
	 * })
	 *
	 * @default []
	 */
	ignoreFiles?: string[]

	/**
	 * A custom template for the `llms.txt` file, allowing for a personalized order of elements.
	 *
	 * Available template elements include:
	 *
	 * - `{title}`: The title extracted from the frontmatter or the first h1 heading in the main document (`index.md`).
	 * - `{description}`: The description.
	 * - `{toc}`: An automatically generated **T**able **O**f **C**ontents.
	 *
	 * @default
	 * `# {title}
	 *
	 * {description}
	 *
	 * ## Table of Contents
	 *
	 * {toc}`
	 */
	customLLMsTxtTemplate?: string

	/**
	 * The directory from which files will be processed.
	 *
	 * This is useful for configuring the plugin to generate documentation for LLMs in a specific language.
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
 * Represents a prepared file, including its title and path.
 */
export type PreparedFile = {
	/**
	 * The title of the file.
	 *
	 * @example 'Guide'
	 */
	title: string

	/**
	 * The absolute path to the file.
	 *
	 * @example 'guide/getting-started.md'
	 */
	path: string
}

/**
 * Configuration interface for VitePress, extending the UserConfig from Vite.
 */
interface VitePressConfig extends UserConfig {
	/** The configuration settings specific to **VitePress**. */
	vitepress: {
		/** The source directory for the documentation files. */
		srcDir: string
		/** The directory where the generated output files will be stored. */
		outDir: string
	}
}
