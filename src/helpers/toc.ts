import path from 'node:path'
import type { DefaultTheme } from 'vitepress'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from '../types'
import { stripExtPosix } from './utils'

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
