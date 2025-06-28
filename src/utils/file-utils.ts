import path from 'node:path'
import byteSize from 'byte-size'
import type { GrayMatterFile, Input } from 'gray-matter'
// @ts-ignore
import markdownTitle from 'markdown-title'
import { compile, match } from 'path-to-regexp'
import type { VitePressConfig } from '../types'

// #region Path utilities
/**
 * Splits a file path into its directory and file components.
 *
 * @param filepath - The path to the file.
 * @returns An object containing the directory and file name.
 */
export const splitDirAndFile = (filepath: string): { dir: string; file: string } => ({
	dir: path.dirname(filepath),
	file: path.basename(filepath),
})

/**
 * Only remove the file extension from the file path if it is a content file.
 *
 * This is needed to avoid removing an extension from a file more than once.
 */
const contentFileExts = new Set(['.md', '.html'])

/**
 * Strips the file extension from a given file path, only if it is a content file.
 *
 * @param filepath - The path to the file.
 * @param usePosix - Whether to return the path in POSIX format.
 * @returns The path without the extension if applicable.
 */
export const stripExt = (filepath: string, usePosix = false): string => {
	const { dir, file } = splitDirAndFile(filepath)
	const ext = path.extname(file)
	const base = contentFileExts.has(ext) ? path.basename(file, ext) : file

	const joinFn = usePosix ? path.posix.join : path.join

	return joinFn(dir, base)
}

export const stripExtPosix = (filepath: string): string => stripExt(filepath, true)

/**
 * Transforms a file path to use forward slashes (POSIX style) instead of backslashes.
 *
 * @param filepath - The file path to transform
 * @returns The file path with forward slashes
 *
 * @example
 * ```ts
 * transformToPosixPath('foo\\bar\\baz.md') // Returns 'foo/bar/baz.md'
 * ```
 */
export const transformToPosixPath = (filepath: string): string => filepath.replace(/\\/g, '/')

/**
 * Resolves the output file path for VitePress with support for route rewrites and dynamic slugs.
 *
 * Handles both static rewrites (exact matches) and dynamic patterns using path-to-regexp.
 * Dynamic patterns support parameters (`:param`) and wildcards (`*wildcard`) as defined
 * in VitePress rewrites configuration.
 *
 * @param file - The source file path to resolve (e.g., 'packages/pkg-a/src/index.md')
 * @param workDir - The working directory to join resolved paths with
 * @param rewrites - VitePress rewrites configuration (object, function, or undefined)
 * @returns The resolved output file path
 */
export function resolveOutputFilePath(
	file: string,
	workDir: string,
	rewrites: VitePressConfig['rewrites'],
): string {
	let resolvedRewrite: string | undefined

	// Handle function-based rewrites
	if (typeof rewrites === 'function') {
		const resolvedFilePath = rewrites(file)
		if (resolvedFilePath) resolvedRewrite = resolvedFilePath
	}
	// Handle object-based rewrites
	else if (rewrites && typeof rewrites === 'object') {
		// First try exact match (static rewrites)
		if (file in rewrites) {
			resolvedRewrite = rewrites[file]
		} else {
			// Try dynamic pattern matching
			for (const [pattern, replacement] of Object.entries(rewrites)) {
				// Skip if it's not a dynamic pattern (no : or *)
				if (!pattern.includes(':') && !pattern.includes('*')) {
					continue
				}

				try {
					const matcher = match(pattern)
					const result = matcher(file)

					if (result) {
						// Compile the replacement pattern with matched parameters
						const compileFn = compile(replacement)
						resolvedRewrite = compileFn(result.params)
						break
					}
				} catch (_error) {
					// Skip invalid patterns silently
				}
			}
		}
	}

	// Return resolved path or original file path
	if (resolvedRewrite) {
		return path.join(workDir, resolvedRewrite)
	}

	return file
}

/**
 * Gets all directories at specific depths relative to the base directory.
 *
 * @param files - Array of file paths
 * @param baseDir - Base directory path
 * @param maxDepth - Maximum depth to traverse (1 = root only, 2 = root + first level, etc.)
 * @returns Array of directory objects with path and depth information
 */
export function getDirectoriesAtDepths(
	files: string[],
	baseDir: string,
	maxDepth: number,
): Array<{
	path: string
	depth: number
	relativePath: string
}> {
	const directories = new Set<string>()

	// Always include root directory
	directories.add(baseDir)

	for (const file of files) {
		const relativePath = path.relative(baseDir, file)
		const parts = relativePath.split(path.sep)

		// Build directory paths up to maxDepth
		for (let depth = 1; depth < Math.min(parts.length, maxDepth); depth++) {
			const dirParts = parts.slice(0, depth)
			const dirPath = path.resolve(baseDir, ...dirParts)
			directories.add(dirPath)
		}
	}

	return Array.from(directories)
		.map((dirPath) => ({
			path: dirPath,
			depth: dirPath === baseDir ? 1 : path.relative(baseDir, dirPath).split(path.sep).length + 1,
			relativePath: path.relative(baseDir, dirPath) || '.',
		}))
		.filter((dir) => dir.depth <= maxDepth)
		.sort((a, b) => {
			// Sort by depth first, then by path
			if (a.depth !== b.depth) return a.depth - b.depth
			return a.path.localeCompare(b.path)
		})
}
// #endregion

/**
 * Extracts the title from a markdown file's frontmatter or first heading.
 *
 * @param file - The markdown file to extract the title from.
 * @returns The extracted title, or `undefined` if no title is found.
 */
export function extractTitle(file: GrayMatterFile<Input>): string | undefined {
	return file.data?.title || file.data?.titleTemplate || markdownTitle(file.content)
}

/**
 * Returns a human-readable string representation of the given string's size in bytes.
 *
 * This function calculates the byte size of a given string by creating a `Blob`
 * and then converts it into a human-readable format using `byte-size`.
 *
 * @param string - The input string whose size needs to be determined.
 * @returns A human-readable size string (e.g., "1.2 KB", "500 B").
 */
export const getHumanReadableSizeOf = (string: string): string => byteSize(new Blob([string]).size).toString()
