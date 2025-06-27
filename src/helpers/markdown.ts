import path from 'node:path'
import type MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token.mjs'
import type { Paragraph, Parent, Root } from 'mdast'
import { type BuildVisitor, visit } from 'unist-util-visit'
import { fullTagRegex, tagRegex } from '../constants'
import type { NotUndefined } from '../types'

/**
 * Creates a remark plugin that either removes or unwraps specified HTML tags from markdown AST.
 *
 * @param intent - Specifies whether to 'remove' the tag and its content completely, or 'unwrap' to keep the content but remove the tags
 * @param tag - The HTML tag name to process (e.g., 'div', 'span', etc.)
 *
 * @returns A function that can be used as a remark plugin
 *
 * @example
 * ```md
 * // To remove all <custom> tags and their content:
 * remarkPlease('remove', 'custom')
 *
 * // To keep content but remove <wrapper> tags:
 * remarkPlease('unwrap', 'wrapper')
 * ```
 *
 * The plugin handles two cases:
 * 1. Single node containing both opening and closing tags
 * 2. Separate nodes for opening and closing tags
 *
 * It also cleans up empty paragraphs that may result from tag removal.
 */
export function remarkPlease(intent: 'remove' | 'unwrap', tag: string) {
	return () =>
		(tree: Root): Root => {
			const ourFullTagRegex = fullTagRegex(tag)

			// First pass: collect all HTML nodes to process
			const nodesToProcess: NotUndefined<Parameters<BuildVisitor<Root, 'html'>>>[] = []
			visit(tree, 'html', (node, index, parent) => {
				if (!parent || typeof index !== 'number') return
				nodesToProcess.push([node, index, parent])
			})

			// Track which paragraph nodes become empty
			const emptyParagraphs = new Set<{ node: Paragraph; parent: Parent }>()

			// Second pass: process nodes in reverse order
			for (const [node, index, parent] of nodesToProcess.reverse()) {
				// Case 1: The entire content is in one HTML node
				if (ourFullTagRegex.test(node.value)) {
					if (intent === 'remove') {
						parent.children.splice(index, 1)
						if (parent.type === 'paragraph' && parent.children.length === 0) {
							emptyParagraphs.add({ node: parent, parent })
						}
						continue
					}
					if (intent === 'unwrap') {
						const match = node.value.match(ourFullTagRegex)
						if (match?.[1]) {
							// Replace the node with its inner content
							node.value = match[1].trim()
						}
						continue
					}
				}

				// Case 2: Opening and closing tags are separate nodes
				if (tagRegex(tag, 'open').test(node.value)) {
					// Find the closing tag
					let closeIndex = index + 1
					while (closeIndex < parent.children.length) {
						const closeNode = parent.children[closeIndex]
						if (closeNode.type === 'html' && tagRegex(tag, 'closed').test(closeNode.value)) {
							break
						}
						closeIndex++
					}

					if (closeIndex < parent.children.length) {
						if (intent === 'remove') {
							// Remove all nodes from opening to closing tag (inclusive)
							parent.children.splice(index, closeIndex - index + 1)
							if (parent.type === 'paragraph' && parent.children.length === 0) {
								emptyParagraphs.add({ node: parent, parent })
							}
						} else if (intent === 'unwrap') {
							// Keep the content between tags, remove only the HTML tag nodes
							parent.children.splice(closeIndex, 1) // Remove closing tag
							parent.children.splice(index, 1) // Remove opening tag
						}
					}
				}
			}

			// Warning: Vibe-coded, be careful.

			// Final pass: collect and remove empty paragraph nodes
			const paragraphsToRemove: Array<{ index: number; parent: Parent }> = []

			// First mark paragraphs that were emptied during tag removal
			for (const { node, parent } of emptyParagraphs) {
				const index = parent.children.indexOf(node)
				if (index !== -1) {
					paragraphsToRemove.push({ index, parent })
				}
			}

			// Then check for any other empty paragraphs (only whitespace or no children)
			visit(tree, 'paragraph', (node, index, parent) => {
				if (!parent || typeof index !== 'number') return

				const isEmpty =
					node.children.length === 0 ||
					(node.children.length === 1 &&
						node.children[0].type === 'text' &&
						node.children[0].value.trim() === '')

				if (isEmpty) {
					paragraphsToRemove.push({ index, parent })
				}
			})

			// Remove empty paragraphs in reverse order to maintain correct indices
			for (const { index, parent } of paragraphsToRemove.reverse()) {
				parent.children.splice(index, 1)
			}

			return tree
		}
}

/**
 * Markdown-it plugin that injects <LlmCopyAndDownload /> after the first H1 heading
 * if `env.frontmatter.layout` is `'doc'` (or not set).
 *
 * @author [Divyansh Singh](https://github.com/brc-dd)
 */
export function copyOrDownloadAsMarkdownButtons(md: MarkdownIt): void {
	const orig = md.renderer.render.bind(md.renderer.render)
	md.renderer.render = (tokens, options, env) => {
		// if (env?.frontmatter && env.frontmatter.layout === 'doc') {
		for (let i = 0; i < tokens.length; i++) {
			if (tokens[i].tag === 'h1' && tokens[i].type === 'heading_open') {
				for (let j = i + 1; j < tokens.length; j++) {
					if (tokens[j].tag === 'h1' && tokens[j].type === 'heading_close') {
						const htmlToken = new Token('html_block', '', 0)
						// We using <llm-exclude> to prevent the component from being rendered in the LLMs files
						htmlToken.content = '<CopyOrDownloadAsMarkdownButtons />'
						tokens.splice(j + 1, 0, htmlToken)
						break
					}
				}
				break
			}
		}
		// }
		return orig(tokens, options, env)
	}
}

/**
 * Creates a remark plugin that replaces image URLs with their hashed equivalents.
 *
 * @param map - Map of original image file names to hashed file paths.
 * @returns A remark plugin that rewrites image URLs.
 *
 * @author [Benjamin BERNARD](https://github.com/Benvii)
 */
export function remarkReplaceImageUrls(map: Map<string, string>) {
	return () =>
		(tree: Root): void => {
			visit(tree, 'image', (node) => {
				const original = path.posix.basename(node.url)
				const hashed = map.get(original)
				if (hashed) {
					node.url = `/${hashed}`
				}
			})
		}
}
