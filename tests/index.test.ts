import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import type { ViteDevServer } from 'vite'
import type { Plugin } from 'vitepress'
import { fakeMarkdownDocument } from './resources'

// Mock the fs module before it's imported by the module under test
const existsSync = mock(() => true)
const mkdirSync = mock()
const readFileSync = mock(() => fakeMarkdownDocument)
const copyFileSync = mock()
const writeFileSync = mock()

mock.module('node:fs', () => ({
	default: {
		existsSync,
		mkdirSync,
		readFileSync,
		copyFileSync,
		writeFileSync,
	},
}))

// Mock the logger to prevent output
mock.module('../src/helpers/logger', () => ({
	default: {
		info: mock(),
		success: mock(),
		warn: mock(),
		error: mock(),
	},
}))

import path from 'node:path'
// Import the module under test AFTER mocking its dependencies
// @ts-ignore
import llmstxt from '../src/index'
import type { VitePressConfig } from '../src/types'

describe('llmstxt plugin', () => {
	let plugin: Plugin
	let mockConfig: VitePressConfig
	let mockServer: ViteDevServer

	beforeEach(() => {
		// Reset mock call counts
		mkdirSync.mockReset()
		copyFileSync.mockReset()
		writeFileSync.mockReset()

		// Setup mock config
		mockConfig = {
			vitepress: {
				outDir: 'dist',
				srcDir: 'docs',
			},
			build: {
				ssr: false,
			},
		} as VitePressConfig

		// Setup mock server
		mockServer = {
			middlewares: {
				use: mock(),
			},
		} as unknown as ViteDevServer

		// Initialize plugin
		plugin = llmstxt()
	})

	describe('configureServer', () => {
		it('should configure server middleware', () => {
			// @ts-ignore
			plugin.configureServer(mockServer)
			const spyMiddlewaresUse = spyOn(mockServer.middlewares, 'use')
			expect(spyMiddlewaresUse).toHaveBeenCalled()
		})
	})

	describe('transform', () => {
		it('should collect markdown files', () => {
			// @ts-ignore
			const result = plugin.transform(0, 'docs/test.md')
			expect(result).toBeNull()
		})

		it('should not collect non-markdown files', () => {
			// @ts-ignore
			const result = plugin.transform(0, 'docs/test.ts')
			expect(result).toBeNull()
		})
	})

	describe('generateBundle', () => {
		it('should skip processing in SSR build', () => {
			const ssrConfig = { ...mockConfig, build: { ssr: true } }
			// @ts-ignore
			plugin.configResolved(ssrConfig)
			// @ts-ignore
			plugin.generateBundle()
			expect(writeFileSync).not.toHaveBeenCalled()
		})

		it('should create output directory if it does not exist', () => {
			existsSync.mockImplementationOnce(() => false)

			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.generateBundle()

			expect(mkdirSync).toHaveBeenCalledWith('dist', { recursive: true })
		})

		it('should process markdown files and generate output files', () => {
			plugin = llmstxt({ generateLLMsFullTxt: false, generateLLMsTxt: false })
			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.transform(0, 'docs/test.md')
			// @ts-ignore
			plugin.transform(0, 'docs/test/test.md')
			// @ts-ignore
			plugin.transform(0, 'docs/guide/index.md')
			// @ts-ignore
			plugin.generateBundle()

			// Verify that files were written
			expect(writeFileSync).toHaveBeenCalledTimes(3)
			expect(writeFileSync).nthCalledWith(
				1,
				path.resolve(mockConfig.vitepress.outDir, 'test.md'),
				'---\nurl: /test.md\n---\n# Some cool stuff\n',
			)
			expect(writeFileSync).nthCalledWith(
				2,
				path.resolve(mockConfig.vitepress.outDir, 'test', 'test.md'),
				'---\nurl: /test/test.md\n---\n# Some cool stuff\n',
			)
			expect(writeFileSync).nthCalledWith(
				3,
				path.resolve(mockConfig.vitepress.outDir, 'guide.md'),
				'---\nurl: /guide.md\n---\n# Some cool stuff\n',
			)
		})

		it('should ignore files specified in ignoreFiles option', () => {
			plugin = llmstxt({
				generateLLMsFullTxt: false,
				generateLLMsTxt: false,
				ignoreFiles: ['test/*.md'],
			})
			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.transform(0, 'docs/test.md')
			// @ts-ignore
			plugin.transform(0, 'docs/test/test.md')
			// @ts-ignore
			plugin.generateBundle()

			// Verify that only non-ignored files were written
			expect(writeFileSync).toHaveBeenCalledTimes(1)
			expect(writeFileSync).toBeCalledWith(
				// docs/test.md
				path.resolve(mockConfig.vitepress.outDir, 'test.md'),
				'---\nurl: /test.md\n---\n# Some cool stuff\n',
			)
		})
	})
})
