import type MarkdownIt from 'markdown-it'
import type { Paragraph, Parent, Root } from 'mdast'
import { type BuildVisitor, visit } from 'unist-util-visit'
import type { NotUndefined } from '../types'

export function vitePressPlease(intent: 'remove' | 'unwrap', tag: string) {
	return (md: MarkdownIt) => {
		md.core.ruler.after('inline', `llm-${intent}-${tag}`, (state) => {
			const matchRegex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)
			const newTokens: typeof state.tokens = []
			for (let i = 0; i < state.tokens.length; i++) {
				const token = state.tokens[i]
				if (
					(token.type === 'html_block' || token.type === 'html_inline') &&
					token.content.match(matchRegex)
				) {
					const match = token.content.match(matchRegex)
					if (intent === 'remove') {
						// skip this token (do not push)
						continue
					}
					if (intent === 'unwrap' && match?.[1]) {
						// parse the inner markdown and inject as tokens
						const inner = match[1].trim()
						const innerTokens = md.parse(inner, state.env)
						newTokens.push(...innerTokens)
						continue
					}
				}
				newTokens.push(token)
			}
			state.tokens = newTokens
		})
	}
}

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
	return () => (tree: Root) => {
		const openTagRegex = new RegExp(`<${tag}>`)
		const closeTagRegex = new RegExp(`</${tag}>`)
		const fullTagRegex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)

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
			if (fullTagRegex.test(node.value)) {
				if (intent === 'remove') {
					parent.children.splice(index, 1)
					if (parent.type === 'paragraph' && parent.children.length === 0) {
						emptyParagraphs.add({ node: parent, parent })
					}
					continue
				}
				if (intent === 'unwrap') {
					const match = node.value.match(fullTagRegex)
					if (match?.[1]) {
						// Replace the node with its inner content
						node.value = match[1].trim()
					}
					continue
				}
			}

			// Case 2: Opening and closing tags are separate nodes
			if (openTagRegex.test(node.value)) {
				// Find the closing tag
				let closeIndex = index + 1
				while (closeIndex < parent.children.length) {
					const closeNode = parent.children[closeIndex]
					if (closeNode.type === 'html' && closeTagRegex.test(closeNode.value)) {
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
