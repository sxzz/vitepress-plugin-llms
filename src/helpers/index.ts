import fs from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'

import { defaultLLMsTxtTemplate } from '../constants'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from '../types'
import { generateTOC } from './toc'
import { expandTemplate, extractTitle, stripExtPosix } from './utils'

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param indexMd - Path to the main documentation file `index.md`.
 * @param vitepressConfig - The VitePress configuration.
 * @param LLMsTxtTemplate - Template to use for generating `llms.txt`.
 * @param templateVariables - Template variables for `customLLMsTxtTemplate`.
 * @returns A string representing the content of the `llms.txt` file.
 *
 * @example
 * ```markdown
 * # Shadcn for Vue
 *
 * > Beautifully designed components built with Radix Vue and Tailwind CSS.
 *
 * ## Table of Contents
 *
 * - [Getting started](/docs/getting-started.md)
 * - [About](/docs/about.md)
 * - ...
 * ```
 *
 * @see https://llmstxt.org/#format
 */
export function generateLLMsTxt(
	preparedFiles: PreparedFile[],
	indexMd: string,
	srcDir: VitePressConfig['vitepress']['srcDir'],
	LLMsTxtTemplate: LlmstxtSettings['customLLMsTxtTemplate'] = defaultLLMsTxtTemplate,
	templateVariables: LlmstxtSettings['customTemplateVariables'] = {},
	vitepressConfig?: VitePressConfig,
	domain?: LlmstxtSettings['domain'],
): string {
	// @ts-expect-error
	matter.clearCache()
	const indexMdFile = matter(fs.readFileSync(indexMd, 'utf-8') as string)

	templateVariables.title ??=
		indexMdFile.data?.hero?.name ||
		vitepressConfig?.vitepress?.userConfig?.title ||
		vitepressConfig?.vitepress?.userConfig?.titleTemplate ||
		extractTitle(indexMdFile) ||
		'LLMs Documentation'

	templateVariables.description ??=
		indexMdFile.data?.hero?.text ||
		vitepressConfig?.vitepress?.userConfig?.description ||
		indexMdFile?.data?.description ||
		indexMdFile.data?.titleTemplate ||
		'This file contains links to all documentation sections.'

	templateVariables.details ??=
		indexMdFile.data?.hero?.tagline || indexMdFile.data?.tagline

	templateVariables.toc ??= generateTOC(
		preparedFiles,
		srcDir,
		domain,
		vitepressConfig,
	)

	return expandTemplate(LLMsTxtTemplate, templateVariables)
}

/**
 * Generates a `llms-full.txt` file content with all documentation in one file.
 *
 * @param preparedFiles - An array of prepared files.
 * @param srcDir - The source directory for the files.
 * @returns A string representing the full content of the LLMs.txt file.
 */
export function generateLLMsFullTxt(
	preparedFiles: PreparedFile[],
	srcDir: VitePressConfig['vitepress']['srcDir'],
	domain?: LlmstxtSettings['domain'],
) {
	const llmsFullTxtContent = preparedFiles
		.map((preparedFile) => {
			const relativePath = path.relative(srcDir, preparedFile.path)
			const description = preparedFile.file.data.description

			preparedFile.file.data = {}
			preparedFile.file.data.url = `${domain || ''}/${stripExtPosix(relativePath)}.md`

			if (description) {
				preparedFile.file.data.description = description
			}

			return matter.stringify(preparedFile.file.content, preparedFile.file.data)
		})
		.join('\n---\n\n')

	return llmsFullTxtContent
}
