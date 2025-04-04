import type { ViteDevServer } from 'vite'
import type { Plugin } from 'vitepress'

import fs from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'
import { minimatch } from 'minimatch'
import pc from 'picocolors'

import { name as packageName } from '../package.json'

import { millify } from 'millify'
import { approximateTokenSize } from 'tokenx'
import { defaultLLMsTxtTemplate } from './constants'
import { generateLLMsFullTxt, generateLLMsTxt } from './helpers/index'
import log from './helpers/logger'
import {
	expandTemplate,
	extractTitle,
	generateMetadata,
	getHumanReadableSizeOf,
	stripExt,
} from './helpers/utils'
import type {
	CustomTemplateVariables,
	LlmstxtSettings,
	PreparedFile,
	VitePressConfig,
} from './types'

const PLUGIN_NAME = packageName

/**
 * [VitePress](http://vitepress.dev/) plugin for generating raw documentation
 * for **LLMs** in Markdown format which is much lighter and more efficient for LLMs
 *
 * @param [userSettings={}] - Plugin settings.
 *
 * @see https://github.com/okineadev/vitepress-plugin-llms
 * @see https://llmstxt.org/
 */
export default function llmstxt(userSettings: LlmstxtSettings = {}): Plugin {
	// Create a settings object with defaults explicitly merged
	const settings: Omit<LlmstxtSettings, 'workDir'> & { workDir: string } = {
		generateLLMsTxt: true,
		generateLLMsFullTxt: true,
		generateLLMFriendlyDocsForEachPage: true,
		ignoreFiles: [],
		workDir: undefined as unknown as string,
		...userSettings,
	}

	// Store the resolved Vite config
	let config: VitePressConfig

	// Set to store all markdown file paths
	const mdFiles: Set<string> = new Set()

	// Flag to identify which build we're in
	let isSsrBuild = false

	return {
		name: PLUGIN_NAME,

		/** Resolves the Vite configuration and sets up the working directory. */
		configResolved(resolvedConfig) {
			config = resolvedConfig as VitePressConfig
			if (settings.workDir) {
				settings.workDir = path.resolve(
					config.vitepress.srcDir,
					settings.workDir as string,
				)
			} else {
				settings.workDir = config.vitepress.srcDir
			}
			// Detect if this is the SSR build
			isSsrBuild = !!resolvedConfig.build?.ssr
			log.info(
				`${pc.bold(PLUGIN_NAME)} initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')} with workDir: ${pc.cyan(settings.workDir as string)}`,
			)
		},

		/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
		// @ts-ignore
		configureServer(server: ViteDevServer) {
			log.info('Dev server configured for serving plain text docs for LLMs')
			server.middlewares.use((req, res, next) => {
				if (req.url?.endsWith('.md') || req.url?.endsWith('.txt')) {
					try {
						// Try to read and serve the markdown file
						const filePath = path.resolve(
							config.vitepress?.outDir ?? 'dist',
							`${stripExt(req.url)}.md`,
						)
						const content = fs.readFileSync(filePath, 'utf-8')
						res.setHeader('Content-Type', 'text/plain; charset=utf-8')
						res.end(content)
						return
					} catch (e) {
						// If file doesn't exist or can't be read, continue to next middleware
						log.warn(`Failed to return ${pc.cyan(req.url)}: File not found`)
						next()
					}
				}

				// Pass to next middleware if not handled
				next()
			})
		},

		/**
		 * Resets the collection of markdown files when the build starts.
		 * This ensures we don't include stale data from previous builds.
		 */
		buildStart() {
			mdFiles.clear()
			log.info('Build started, file collection cleared')
		},

		/**
		 * Processes each file that Vite transforms and collects markdown files.
		 * @param _ - The file content (not used).
		 * @param id - The file identifier (path).
		 * @returns null if the file is processed, otherwise returns the original content.
		 */
		transform(_, id: string) {
			if (!id.endsWith('.md')) {
				return null
			}

			// Skip files outside workDir if it's configured
			if (!id.startsWith(settings.workDir as string)) {
				return null
			}

			if (settings.ignoreFiles?.length) {
				for (const pattern of settings.ignoreFiles) {
					if (
						typeof pattern === 'string' &&
						minimatch(path.relative(settings.workDir as string, id), pattern)
					) {
						return null
					}
				}
			}

			// Add markdown file path to our collection
			mdFiles.add(id)
			// Return null to avoid modifying the file
			return null
		},

		/**
		 * Runs only in the client build (not SSR) after completion.
		 * This ensures the processing happens exactly once.
		 */
		generateBundle() {
			// Skip processing during SSR build
			if (isSsrBuild) {
				log.info('Skipping LLMs docs generation in SSR build')
				return
			}

			const outDir = config.vitepress?.outDir ?? 'dist'

			// Create output directory if it doesn't exist
			if (!fs.existsSync(outDir)) {
				log.info(`Creating output directory: ${pc.cyan(outDir)}`)
				fs.mkdirSync(outDir, { recursive: true })
			}

			const mdFilesList = Array.from(mdFiles)
			const fileCount = mdFilesList.length

			// Skip if no files found
			if (fileCount === 0) {
				log.warn(
					`No markdown files found to process. Check your \`${pc.bold('workDir')}\` and \`${pc.bold('ignoreFiles')}\` settings.`,
				)
				return
			}

			log.info(
				`Processing ${pc.bold(fileCount.toString())} markdown files from ${pc.cyan(settings.workDir)}`,
			)

			const preparedFiles: PreparedFile[] = []

			// Copy all markdown files to output directory
			for (const file of mdFilesList) {
				const mdFile = matter(fs.readFileSync(file, 'utf-8'))
				const title = extractTitle(mdFile)?.trim() || 'Untitled'

				const filePath =
					path.basename(file) === 'index.md' &&
					path.dirname(file) !== settings.workDir
						? `${path.dirname(file)}.md`
						: file

				preparedFiles.push({ path: filePath, title, file: mdFile })
			}

			if (settings.generateLLMFriendlyDocsForEachPage) {
				for (const file of preparedFiles) {
					try {
						const mdFile = file.file
						const relativePath = path.relative(settings.workDir, file.path)
						const targetPath = path.resolve(outDir, relativePath)

						// Ensure target directory exists
						fs.mkdirSync(path.dirname(targetPath), { recursive: true })

						// Copy file to output directory
						fs.writeFileSync(
							targetPath,
							matter.stringify(
								mdFile.content,
								generateMetadata(mdFile, settings.domain, relativePath),
							),
						)
						log.success(`Processed ${pc.cyan(relativePath)}`)
					} catch (error) {
						log.error(
							// @ts-ignore
							`Failed to process ${pc.cyan(relativePath)}: ${error.message}`,
						)
					}
				}
			}

			// Sort files by title for better organization
			preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

			// Generate llms.txt - table of contents with links
			if (settings.generateLLMsTxt) {
				const llmsTxtPath = path.resolve(outDir, 'llms.txt')
				const templateVariables: CustomTemplateVariables = {
					title: settings.title,
					description: settings.description,
					details: settings.details,
					toc: settings.toc,
					...settings.customTemplateVariables,
				}

				log.info(`Generating ${pc.cyan('llms.txt')}...`)

				const llmsTxt = generateLLMsTxt(
					preparedFiles,
					path.resolve(settings.workDir as string, 'index.md'),
					settings.workDir as string,
					settings.customLLMsTxtTemplate || defaultLLMsTxtTemplate,
					templateVariables,
					config?.vitepress?.userConfig,
					settings.domain,
					settings.sidebar,
				)

				fs.writeFileSync(llmsTxtPath, llmsTxt, 'utf-8')
				log.success(
					expandTemplate(
						'Generated {file} (~{tokens} tokens, {size}) with {fileCount} documentation links',
						{
							file: pc.cyan('llms.txt'),
							tokens: pc.bold(millify(approximateTokenSize(llmsTxt))),
							size: pc.bold(getHumanReadableSizeOf(llmsTxt)),
							fileCount: pc.bold(fileCount.toString()),
						},
					),
				)
			}

			// Generate llms-full.txt - all content in one file
			if (settings.generateLLMsFullTxt) {
				const llmsFullTxtPath = path.resolve(outDir, 'llms-full.txt')

				log.info(
					`Generating full documentation bundle (${pc.cyan('llms-full.txt')})...`,
				)

				const llmsFullTxt = generateLLMsFullTxt(
					preparedFiles,
					settings.workDir as string,
					settings.domain,
				)

				// Write content to llms-full.txt
				fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, 'utf-8')
				log.success(
					expandTemplate(
						'Generated {file} (~{tokens} tokens, {size}) with {fileCount} markdown files',
						{
							file: pc.cyan('llms-full.txt'),
							tokens: pc.bold(millify(approximateTokenSize(llmsFullTxt))),
							size: pc.bold(getHumanReadableSizeOf(llmsFullTxt)),
							fileCount: pc.bold(fileCount.toString()),
						},
					),
				)
			}
		},
	}
}
