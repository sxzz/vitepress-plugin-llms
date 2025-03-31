import fs from 'node:fs'
import path from 'node:path'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from './types'
import type { DefaultTheme } from 'vitepress'
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
 * @returns The title of the markdown file, or a default title if none is found.
 */
export function extractTitle(file: GrayMatterFile<Input>): string {
	const titleFromFrontmatter = file.data?.title || file.data?.titleTemplate
	let titleFromMarkdown: string | undefined

	if (!titleFromFrontmatter) {
		titleFromMarkdown = markdownTitle(file.content)

		if (titleFromMarkdown) {
			titleFromMarkdown = stripHtml(titleFromMarkdown).result
		}
	}
	return titleFromFrontmatter || titleFromMarkdown
}

/**
 * Generates a Markdown-formatted table of contents (TOC) link for a given file.
 *
 * @param file - The prepared file.
 * @param domain - The base domain for the generated link.
 * @param relativePath - The relative path of the file, which is converted to a `.md` link.
 * @returns The formatted TOC entry as a Markdown list item.
 */
export const generateTOCLink = (
	file: PreparedFile,
	domain: LlmstxtSettings['domain'],
	relativePath: string,
) =>
	`- [${file.title}](${domain || ''}/${stripExtPosix(relativePath)}.md)${file.file.data.description ? `: ${file.file.data.description}` : ''}\n`

/**
 * Recursively collects all paths from sidebar items
 *
 * @param items - Array of sidebar items to process
 * @returns Array of paths collected from the sidebar items
 */
function collectPathsFromSidebarItems(
	items: DefaultTheme.SidebarItem[],
): string[] {
	const paths: string[] = []

	for (const item of items) {
		// Add the current item's path if it exists
		if (item.link) {
			paths.push(item.link)
		}

		// Recursively add paths from nested items
		if (item.items && Array.isArray(item.items)) {
			paths.push(...collectPathsFromSidebarItems(item.items))
		}
	}

	return paths
}

/**
 * Processes sidebar items and generates TOC entries
 *
 * @param section - A sidebar section
 * @param preparedFiles - An array of prepared files
 * @param srcDir - The VitePress source directory
 * @param domain - Optional domain to prefix URLs with
 * @param depth - Current depth level for headings
 * @returns A string representing the formatted section of the TOC
 */
function processSidebarSection(
	section: DefaultTheme.SidebarItem,
	preparedFiles: PreparedFile[],
	srcDir: VitePressConfig['vitepress']['srcDir'],
	domain?: LlmstxtSettings['domain'],
	depth = 3,
): string {
	let sectionTOC = ''

	// Add section header
	if (section.text) {
		sectionTOC += `${'#'.repeat(depth)} ${section.text}\n\n`
	}

	// Process items in this section
	if (section.items && Array.isArray(section.items)) {
		// Find files that match paths in this section's items
		const sectionPaths = collectPathsFromSidebarItems(section.items)

		const sectionFiles = preparedFiles.filter((file) => {
			const relativePath = `/${stripExtPosix(path.relative(srcDir, file.path))}`
			return sectionPaths.some(
				(sectionPath) =>
					relativePath === sectionPath ||
					relativePath === `${sectionPath}.md` ||
					`${relativePath}.md` === sectionPath,
			)
		})

		// Add links to files in this section
		for (const file of sectionFiles) {
			const relativePath = path.relative(srcDir, file.path)
			sectionTOC += generateTOCLink(file, domain, relativePath)
		}

		sectionTOC += '\n'

		// Process subsections recursively (for nested sidebar structures)
		for (const item of section.items) {
			if (item.items && Array.isArray(item.items) && item.items.length > 0) {
				sectionTOC += processSidebarSection(
					item,
					preparedFiles,
					srcDir,
					domain,
					depth + 1,
				)
			}
		}
	}

	return sectionTOC
}

/**
 * Flattens the sidebar configuration when it's an object with path keys
 *
 * @param sidebarConfig - The sidebar configuration from VitePress
 * @returns An array of sidebar items
 */
function flattenSidebarConfig(
	sidebarConfig: DefaultTheme.Sidebar,
): DefaultTheme.SidebarItem[] {
	// If it's already an array, return as is
	if (Array.isArray(sidebarConfig)) {
		return sidebarConfig
	}

	// If it's an object with path keys, flatten it
	if (typeof sidebarConfig === 'object') {
		return Object.values(sidebarConfig).flat()
	}

	// If it's neither, return an empty array
	return []
}

/**
 * Generates a Table of Contents (TOC) for the provided prepared files.
 *
 * Each entry in the TOC is formatted as a markdown link to the corresponding
 * text file. If a VitePress sidebar configuration is provided, the TOC will be
 * organized into sections based on the sidebar structure, with heading levels (#, ##, ###)
 * reflecting the nesting depth of the sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param srcDir - The VitePress source directory.
 * @param domain - Optional domain to prefix URLs with.
 * @param vitepressConfig - Optional VitePress configuration.
 * @returns A string representing the formatted Table of Contents.
 */
export function generateTOC(
	preparedFiles: PreparedFile[],
	srcDir: VitePressConfig['vitepress']['srcDir'],
	domain?: LlmstxtSettings['domain'],
	vitepressConfig?: VitePressConfig,
): string {
	let tableOfContent = ''
	const sidebarConfig =
		vitepressConfig?.vitepress?.userConfig?.themeConfig?.sidebar

	// If sidebar configuration exists
	if (sidebarConfig) {
		// Flatten sidebar config if it's an object with path keys
		const flattenedSidebarConfig = flattenSidebarConfig(sidebarConfig)

		// Process each top-level section in the flattened sidebar
		if (flattenedSidebarConfig.length > 0) {
			for (const section of flattenedSidebarConfig) {
				tableOfContent += processSidebarSection(
					section,
					preparedFiles,
					srcDir,
					domain,
				)
			}

			// Find files that didn't match any section
			const allSidebarPaths = collectPathsFromSidebarItems(
				flattenedSidebarConfig,
			)
			const unsortedFiles = preparedFiles.filter((file) => {
				const relativePath = `/${stripExtPosix(path.relative(srcDir, file.path))}`
				return !allSidebarPaths.some(
					(sidebarPath) =>
						relativePath === sidebarPath ||
						relativePath === `${sidebarPath}.md` ||
						`${relativePath}.md` === sidebarPath,
				)
			})

			// Add files that didn't match any section
			if (unsortedFiles.length > 0) {
				tableOfContent += '### Other\n\n'
				for (const file of unsortedFiles) {
					const relativePath = path.relative(srcDir, file.path)
					tableOfContent += generateTOCLink(file, domain, relativePath)
				}
			}
		} else {
			// If there's an empty sidebar configuration, just add all files
			for (const file of preparedFiles) {
				const relativePath = path.relative(srcDir, file.path)
				tableOfContent += generateTOCLink(file, domain, relativePath)
			}
		}
	} else {
		// If there's no sidebar configuration, just add all files
		for (const file of preparedFiles) {
			const relativePath = path.relative(srcDir, file.path)
			tableOfContent += generateTOCLink(file, domain, relativePath)
		}
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
 * const regex = templateVariable('name');
 * console.log(regex.test('Hello {name}')); // true
 * ```
 */
const templateVariable = (key: string) =>
	new RegExp(`(\\n\\s*\\n)?\\{${key}\\}`, 'gi')

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
	value: string | undefined,
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
	values: { [key: string]: string | undefined },
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
) {
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
