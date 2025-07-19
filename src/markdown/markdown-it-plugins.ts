import type MarkdownIt from 'markdown-it'
import Token from 'markdown-it/lib/token.mjs'

// spell-checker:words Divyansh
/**
 * Markdown-it plugin that injects <CopyOrDownloadAsMarkdownButtons /> after the first H1 heading
 *
 * @param componentName - The name of the Vue component to inject
 * (default: `'CopyOrDownloadAsMarkdownButtons'`), useful when you need to
 * customize the name of a component if such a component is already registered
 * so as not to get confused with it
 *
 * @author [Divyansh Singh](https://github.com/brc-dd)
 */
export function copyOrDownloadAsMarkdownButtons(
	md: MarkdownIt,
	componentName = 'CopyOrDownloadAsMarkdownButtons',
): void {
	const orig = md.renderer.render.bind(md.renderer.render)
	md.renderer.render = (tokens, options, env) => {
		// if (env?.frontmatter && env.frontmatter.layout === 'doc') {
		for (let i = 0; i < tokens.length; i++) {
			if (tokens[i].tag === 'h1' && tokens[i].type === 'heading_open') {
				for (let j = i + 1; j < tokens.length; j++) {
					if (tokens[j].tag === 'h1' && tokens[j].type === 'heading_close') {
						const htmlToken = new Token('html_block', '', 0)
						htmlToken.content = `<${componentName} />`
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
