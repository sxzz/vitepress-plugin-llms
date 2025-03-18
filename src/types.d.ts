import type { UserConfig } from 'vite'

export interface LlmstxtSettings {
	/**
	 * Determines whether to generate the `llms-full.txt` which contains all the documentation in one file.
	 *
	 * @default true
	 */
	generateLLMsFullTxt?: boolean
	/**
	 * Determines whether to generate the `llms.txt` which contains a list of sections with links.
	 *
	 * @default true
	 */
	generateLLMsTxt?: boolean
}

export type PreparedFile = {
	// content: string
	title: string
	// fileName: string
	path: string
}

interface VitePressConfig extends UserConfig {
	vitepress: {
		outDir: string
	}
}
