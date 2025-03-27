import fs from 'node:fs'
import path from 'node:path'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from './types'
import matter, { type GrayMatterFile, type Input } from 'gray-matter'
// @ts-ignore
import markdownTitle from 'markdown-title'
import { stripHtml } from 'string-strip-html'
import { defaultLLMsTxtTemplate } from './constants'

/**
 * Splits a file path into its directory and file components.
 *
 * @param filepath - The path to the file.
 * @returns An object containing the directory and file name.
 */
export const splitDirAndFile = (filepath: string) => ({
	dir: path.dirname(filepath),
	file: path.basename(filepath),
})

/**
 * Strips the file extension from a given file path.
 *
 * @param filepath - The path to the file.
 * @returns The filename without the extension.
 */
export const stripExt = (filepath: string) => {
	const { dir, file } = splitDirAndFile(filepath)

	return path.join(dir, path.basename(file, path.extname(file)))
}

/**
 * Strips the file extension from a given file path using POSIX format.
 *
 * @param filepath - The path to the file.
 * @returns The filename without the extension in POSIX format.
 */
export const stripExtPosix = (filepath: string) => {
	const { dir, file } = splitDirAndFile(filepath)

	return path.posix.join(dir, path.basename(file, path.extname(file)))
}

/**
 * Extracts the title from a markdown file.
 *
 * @param content - The content of the markdown file.
 * @param vitepressConfig - The VitePress configuration.
 * @returns The title of the markdown file, or a default title if none is found.
 */
export function extractTitle(
	file: GrayMatterFile<Input>,
	vitepressConfig: VitePressConfig,
): string {
	return (
		file.data?.title ||
		vitepressConfig?.vitepress?.userConfig?.title ||
		file.data?.titleTemplate ||
		vitepressConfig?.vitepress?.userConfig?.titleTemplate ||
		markdownTitle(
			stripHtml(file.content, { stripTogetherWithTheirContents: ['*'] }).result,
		)
	)
}

/**
 * Generates a Table of Contents (TOC) for the provided prepared files.
 *
 * Each entry in the TOC is formatted as a markdown link to the corresponding
 * text file.
 *
 * @param preparedFiles - An array of prepared files.
 * @param srcDir - The VitePress source directory.
 * @returns A string representing the formatted Table of Contents.
 */
export function generateTOC(
	preparedFiles: PreparedFile[],
	srcDir: VitePressConfig['vitepress']['srcDir'],
) {
	let tableOfContent = ''

	for (const file of preparedFiles) {
		const relativePath = path.relative(srcDir, file.path)
		tableOfContent += `- [${file.title}](/${stripExtPosix(relativePath)}.md)\n`
	}

	return tableOfContent
}

/**
 * Creates a regular expression to match a specific template variable in the format `{key}`.
 *
 * @param key - The name of the template variable to match.
 * @returns A case-insensitive regular expression that detects `{key}` occurrences in a string.
 *
 * @example
 * ```ts
 * const regex = templateVariable('NAME');
 * console.log(regex.test('Hello {NAME}')); // true
 * ```
 */
const templateVariable = (key: string) =>
	new RegExp(`(\n\s*\n)?\{${key}\}`, 'gi')

/**
 * Replaces occurrences of a template variable `{variable}` in a given content string with a provided value.
 * If the value is empty or undefined, it falls back to a specified fallback value.
 *
 * @param content - The template string containing placeholders.
 * @param variable - The template variable name to replace.
 * @param value - The value to replace the variable with.
 * @param fallback - An optional fallback value if `value` is empty.
 * @returns A new string with the template variable replaced.
 *
 * @example
 * ```ts
 * const template = 'Hello {name}!';
 * const result = replaceTemplateVariable(template, 'name', 'Alice', 'User');
 * console.log(result); // 'Hello Alice!'
 * ```
 */
export function replaceTemplateVariable(
	content: string,
	variable: string,
	value: string,
	fallback?: string,
) {
	return content.replace(templateVariable(variable), (_, prefix) => {
		const val = value?.length ? value : fallback?.length ? fallback : ''
		return val ? `${prefix ? '\n\n' : ''}${val}` : ''
	})
}

/**
 * Expands a template string by replacing multiple template variables with their corresponding values.
 *
 * @param template - The template string containing placeholders.
 * @param values - An object mapping variable names to their respective values.
 * @returns A string with all template variables replaced.
 *
 * @example
 * ```ts
 * const template = 'Hello {name}, welcome to {place}!';
 * const values = { name: 'Alice', place: 'Wonderland' };
 * const result = expandTemplate(template, values);
 * console.log(result); // 'Hello Alice, welcome to Wonderland!'
 * ```
 */
export function expandTemplate(
	template: string,
	values: { [key: string]: string },
): string {
	return Object.entries(values).reduce(
		(result, [key, value]) => replaceTemplateVariable(result, key, value),
		template,
	)
}

/**
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param indexMd - Path to the main documentation file `index.md`.
 * @param vitepressConfig - The VitePress configuration.
 * @param customLLMsTxtTemplate - Template to use for generating `llms.txt`.
 * @param customTemplateVariables - Custom variables for `customLLMsTxtTemplate`.
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
	vitepressConfig: VitePressConfig,
	srcDir: VitePressConfig['vitepress']['srcDir'],
	customLLMsTxtTemplate: LlmstxtSettings['customLLMsTxtTemplate'] = defaultLLMsTxtTemplate,
	customTemplateVariables: LlmstxtSettings['customTemplateVariables'] = {},
) {
	// @ts-expect-error
	matter.clearCache()
	const indexMdFile = matter(fs.readFileSync(indexMd, 'utf-8') as string)

	// biome-ignore lint/suspicious/noExplicitAny:
	const defaults: Record<string, any> = {}

	if (!customTemplateVariables.title) {
		defaults.title =
			indexMdFile.data?.hero?.name ||
			extractTitle(indexMdFile, vitepressConfig) ||
			'LLMs Documentation'
	}

	if (!customTemplateVariables.description) {
		defaults.description =
			indexMdFile.data?.hero?.text ||
			vitepressConfig?.vitepress?.userConfig?.description ||
			indexMdFile?.data?.description ||
			indexMdFile.data?.titleTemplate ||
			'This file contains links to all documentation sections.'
	}

	if (!customTemplateVariables.details) {
		defaults.details =
			indexMdFile.data?.hero?.tagline || indexMdFile.data?.tagline
	}

	if (!customTemplateVariables.toc) {
		defaults.toc = generateTOC(preparedFiles, srcDir)
	}

	return expandTemplate(customLLMsTxtTemplate, {
		...defaults,
		...customTemplateVariables,
	})
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
) {
	const llmsFullTxtContent = preparedFiles
		.map((file) => {
			const relativePath = path.relative(srcDir, file.path)

			file.file.data = {
				url: `/${stripExtPosix(relativePath)}.md`,
			}

			return matter.stringify(file.file.content, file.file.data)
		})
		.join('\n---\n\n')

	return llmsFullTxtContent
}
