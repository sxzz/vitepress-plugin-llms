import fs from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'
import type { Connect } from 'vite'
import log from './helpers/logger'
import { stripExt } from './helpers/utils'
import type { VitePressConfig } from './types'

export default (vitePressConfig: VitePressConfig['vitepress']) =>
	(async (req, res, next): Promise<void> => {
		if (req.url?.endsWith('.md') || req.url?.endsWith('.txt')) {
			try {
				// Try to read and serve the markdown file
				const filePath = path.resolve(vitePressConfig?.outDir ?? 'dist', `${stripExt(req.url)}.md`)
				const content = await fs.readFile(filePath, 'utf-8')
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
	}) satisfies Connect.NextHandleFunction
