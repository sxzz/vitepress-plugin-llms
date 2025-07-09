declare module 'markdown-title' {
	/**
	 * Extracts the title from a markdown string by finding the first level-1 heading.
	 *
	 * @description This function searches for the first occurrence of a level-1 heading
	 * (starting with a single `#`) in the provided markdown content and returns its text
	 * content without the hash symbols and surrounding whitespace.
	 *
	 * @param markdown - The markdown string to extract the title from
	 *
	 * @returns The title text if a level-1 heading is found, otherwise `undefined`
	 *
	 * @example
	 * ```typescript
	 * const markdown = "# My Title\n\nSome content here"
	 * const title = markdownTitle(markdown)
	 * console.log(title) // "My Title"
	 * ```
	 */
	declare function markdownTitle(markdown: string): string | undefined

	export default markdownTitle
}
