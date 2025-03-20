import fs from 'node:fs'
import path from 'node:path'
import type { PreparedFile, VitePressConfig } from './types'
import matter from 'gray-matter'
// @ts-ignore
import markdownTitle from 'markdown-title'
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
export function extractTitle(content: string): string {
	const contentData = matter(content)
	return (
		contentData.data?.titleTemplate ||
		contentData.data?.title ||
		contentData.data?.hero?.name ||
		markdownTitle(content)
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
 * Generates a LLMs.txt file with a table of contents and links to all documentation sections.
 *
 * @param preparedFiles - An array of prepared files.
 * @param indexMd - Path to the main documentation file `index.md`.
 * @param llmsTxtTemplate - Template to use for generating `llms.txt`.
 * @returns A string representing the content of the `llms.txt` file.
 *
 * @see https://llmstxt.org
 */
export function generateLLMsTxt(
	preparedFiles: PreparedFile[],
	indexMd: string,
	srcDir: VitePressConfig['vitepress']['srcDir'],
	llmsTxtTemplate: string = defaultLLMsTxtTemplate,
) {
	const indexMdFile = matter(fs.readFileSync(indexMd, 'utf-8') as string)
	let llmsTxtContent = llmsTxtTemplate

	llmsTxtContent = llmsTxtContent.replace(
		/{title}/gi,
		extractTitle(indexMdFile.orig.toString()) || 'LLMs Documentation',
	)
	llmsTxtContent = llmsTxtContent.replace(
		/{description}/gi,
		indexMdFile.data?.hero?.tagline ||
			indexMdFile.data?.titleTemplate ||
			'This file contains links to all documentation sections.',
	)

	llmsTxtContent = llmsTxtContent.replace(
		/{toc}/gi,
		generateTOC(preparedFiles, srcDir),
	)

	return llmsTxtContent
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
			const fileContent = matter(fs.readFileSync(file.path, 'utf-8'))

			return matter.stringify(fileContent.content, {
				url: `/${stripExtPosix(relativePath)}.md`,
			})
		})
		.join('\n---\n\n')

	return llmsFullTxtContent
}
