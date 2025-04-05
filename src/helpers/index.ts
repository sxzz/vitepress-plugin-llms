import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'

import type { DefaultTheme } from 'vitepress'
import { defaultLLMsTxtTemplate } from '../constants'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from '../types'
import { generateTOC } from './toc'
import { expandTemplate, extractTitle, generateMetadata } from './utils'

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param indexMd - Path to the main documentation file `index.md`.
 * @param vitepressConfig - The VitePress configuration.
 * @param LLMsTxtTemplate - Template to use for generating `llms.txt`.
 * @param templateVariables - Template variables for `customLLMsTxtTemplate`.
 * @param domain - The base domain for the generated links.
 * @param sidebar - Optional sidebar configuration for organizing the TOC.
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
export async function generateLLMsTxt(
	preparedFiles: PreparedFile[],
	indexMd: string,
	srcDir: VitePressConfig['vitepress']['srcDir'],
	LLMsTxtTemplate: LlmstxtSettings['customLLMsTxtTemplate'] = defaultLLMsTxtTemplate,
	templateVariables: LlmstxtSettings['customTemplateVariables'] = {},
	vitepressConfig?: VitePressConfig['vitepress']['userConfig'],
	domain?: LlmstxtSettings['domain'],
	sidebar?: DefaultTheme.Sidebar,
): Promise<string> {
	// @ts-expect-error
	matter.clearCache()
	const indexMdContent = await fs.readFile(indexMd, 'utf-8')
	const indexMdFile = matter(indexMdContent as string)

	templateVariables.title ??=
		indexMdFile.data?.hero?.name ||
		indexMdFile.data?.title ||
		vitepressConfig?.title ||
		vitepressConfig?.titleTemplate ||
		extractTitle(indexMdFile) ||
		'LLMs Documentation'

	templateVariables.description ??=
		indexMdFile.data?.hero?.text ||
		vitepressConfig?.description ||
		indexMdFile?.data?.description ||
		indexMdFile.data?.titleTemplate

	templateVariables.details ??=
		indexMdFile.data?.hero?.tagline ||
		indexMdFile.data?.tagline ||
		(!templateVariables.description &&
			'This file contains links to all documentation sections.')

	templateVariables.toc ??= await generateTOC(
		preparedFiles,
		srcDir,
		domain,
		sidebar || vitepressConfig?.themeConfig?.sidebar,
	)

	return expandTemplate(LLMsTxtTemplate, templateVariables)
}

/**
 * Generates a `llms-full.txt` file content with all documentation in one file.
 *
 * @param preparedFiles - An array of prepared files.
 * @param srcDir - The source directory for the files.
 * @param domain - The base domain for the generated links.
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

			return matter.stringify(
				preparedFile.file.content,
				generateMetadata(preparedFile.file, domain, relativePath),
			)
		})
		.join('\n---\n\n')

	return llmsFullTxtContent
}
