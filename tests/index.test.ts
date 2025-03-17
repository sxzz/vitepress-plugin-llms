import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test'
import type { Plugin, ViteDevServer, UserConfig } from 'vite'

// Mock the logger to prevent output
mock.module('../src/logger', () => ({
	default: {
		info: mock(),
		success: mock(),
		warn: mock(),
		error: mock(),
	},
}))

// Mock fs and path modules
mock.module('node:fs', () => ({
	default: {
		existsSync: mock(),
		mkdirSync: mock(),
		readFileSync: mock(),
		copyFileSync: mock(),
		writeFileSync: mock(),
	},
}))

import fs from 'node:fs'

// @ts-ignore
import llmstxt from '../src/index'

describe('llmstxt plugin', () => {
	let plugin: Plugin
	let mockConfig: UserConfig
	let mockServer: ViteDevServer

	beforeEach(() => {
		// Setup mock config
		mockConfig = {
			vitepress: {
				outDir: 'dist',
			},
			build: {
				ssr: false,
			},
		} as UserConfig

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
			const result = plugin.transform('', 'test.md')
			expect(result).toBeNull()
		})

		it('should not collect non-markdown files', () => {
			// @ts-ignore
			const result = plugin.transform('', 'test.ts')
			expect(result).toBeUndefined()
		})
	})

	describe('generateBundle', () => {
		it('should skip processing in SSR build', () => {
			const ssrConfig = { ...mockConfig, build: { ssr: true } }
			// @ts-ignore
			plugin.configResolved(ssrConfig)
			// @ts-ignore
			plugin.generateBundle()
			expect(fs.writeFileSync).not.toHaveBeenCalled()
		})

		it('should create output directory if it does not exist', () => {
			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.generateBundle()

			expect(fs.mkdirSync).toHaveBeenCalledWith('dist', { recursive: true })
		})

		it('should process markdown files and generate output files', () => {
			// @ts-ignore
			plugin.configResolved(mockConfig)
			// @ts-ignore
			plugin.transform('', 'test.md')
			// @ts-ignore
			plugin.generateBundle()

			// Verify that files were written
			expect(fs.writeFileSync).toHaveBeenCalled()
		})
	})
})
