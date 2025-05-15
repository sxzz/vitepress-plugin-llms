import type { Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'

export default () => {
	// Unwrap @llm-include comments into markdown content
	return (tree: Root) => {
		visit(tree, 'html', (node, index, parent) => {
			if (node.value.match(/^<!-- @llm-include[ \n]/)) {
				const match = node.value.match(/<!-- @llm-include[ \n]+([\s\S]*?)-->/)
				if (match?.[1] && parent && typeof index === 'number') {
					// Parse the markdown content and get its children
					const parsed = fromMarkdown(match[1].trim())
					// Replace the comment node with the parsed markdown content
					parent.children.splice(index, 1, ...parsed.children)
				}
			}
		})
		return tree
	}
}
