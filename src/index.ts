import type { Plugin } from 'vitepress'
import type { ViteDevServer } from 'vite'

import fs from 'node:fs'
import path from 'node:path'

import pc from 'picocolors'
import { minimatch } from 'minimatch'
import {
	extractTitle,
	generateLLMsFullTxt,
	generateLLMsTxt,
	stripExt,
	stripExtPosix,
} from './helpers'
import log from './logger'
import type { LlmstxtSettings, PreparedFile, VitePressConfig } from './types'
import matter from 'gray-matter'
import { defaultLLMsTxtTemplate } from './constants'
import { name as packageName } from '../package.json'

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
	const settings: LlmstxtSettings = {
		generateLLMsFullTxt: true,
		generateLLMsTxt: true,
		ignoreFiles: [],
		customLLMsTxtTemplate: defaultLLMsTxtTemplate,
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
		enforce: 'post', // Run after other plugins

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
				`Plugin initialized ${isSsrBuild ? pc.dim('(SSR build)') : pc.dim('(client build)')}`,
			)
		},

		/** Configures the development server to handle `llms.txt` and markdown files for LLMs. */
		configureServer(server: ViteDevServer) {
			log.info('Development server configured to serve markdown files')
			server.middlewares.use((req, res, next) => {
				if (req.url?.endsWith('.md') || req.url?.endsWith('.txt')) {
					try {
						// Try to read and serve the markdown file
						const filePath = path.resolve(
							config.vitepress?.outDir ?? 'dist',
							`${stripExt(req.url)}.md`,
						)
						const content = fs.readFileSync(filePath, 'utf-8')
						res.setHeader('Content-Type', 'text/markdown')
						res.end(content)
						return
					} catch (e) {
						// If file doesn't exist or can't be read, continue to next middleware
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
				log.info('Skipping file generation in SSR build')
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
				log.warn('No markdown files found to process')
				return
			}

			log.info(`Processing ${pc.bold(fileCount.toString())} markdown files...`)

			const preparedFiles: PreparedFile[] = []

			// Copy all markdown files to output directory
			for (const file of mdFilesList) {
				const relativePath = path.relative(settings.workDir as string, file)
				const targetPath = path.resolve(outDir, relativePath)

				try {
					const fileContent = matter(fs.readFileSync(file, 'utf-8'))
					const title = extractTitle(fileContent.orig.toString()) || 'Untitled'

					preparedFiles.push({ title, path: file })

					// Ensure target directory exists
					fs.mkdirSync(path.dirname(targetPath), { recursive: true })

					fileContent.data = {
						url: `/${stripExtPosix(relativePath)}.md`,
					}

					if (fileContent.data?.description?.length) {
						// biome-ignore lint/correctness/noSelfAssign: <explanation>
						fileContent.data.description = fileContent.data?.description
					}

					// Copy file to output directory
					fs.writeFileSync(
						targetPath,
						matter.stringify(fileContent.content, fileContent.data),
					)
					log.success(`Copied ${pc.cyan(relativePath)} to output directory`)
				} catch (error) {
					// @ts-ignore
					log.error(`Failed to copy ${pc.cyan(relativePath)}: ${error.message}`)
				}
			}

			// Sort files by title for better organization
			preparedFiles.sort((a, b) => a.title.localeCompare(b.title))

			// Generate llms.txt - table of contents with links
			if (settings.generateLLMsTxt) {
				const llmsTxtPath = path.resolve(outDir, 'llms.txt')

				const llmsTxt = generateLLMsTxt(
					preparedFiles,
					path.resolve(settings.workDir as string, 'index.md'),
					settings.workDir as string,
					settings.customLLMsTxtTemplate,
					settings.customTemplateVariables,
				)

				fs.writeFileSync(llmsTxtPath, llmsTxt, 'utf-8')
				log.success(
					`Generated ${pc.cyan('llms.txt')} with ${pc.bold(fileCount.toString())} documentation sections`,
				)
			}

			// Generate llms-full.txt - all content in one file
			if (settings.generateLLMsFullTxt) {
				const llmsFullTxtPath = path.resolve(outDir, 'llms-full.txt')

				log.info(`Generating ${pc.cyan('llms-full.txt')}...`)

				const llmsFullTxt = generateLLMsFullTxt(
					preparedFiles,
					settings.workDir as string,
				)

				// Write content to llms-full.txt
				fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, 'utf-8')
				log.success(
					`Generated ${pc.cyan('llms-full.txt')} with ${pc.bold(fileCount.toString())} markdown files`,
				)
			}
		},
	}
}
