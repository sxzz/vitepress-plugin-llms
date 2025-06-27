/**
 * Cleans a URL by removing query parameters, hash fragments, and file extensions
 * @param url - The URL to clean. If not provided, uses current page URL
 * @returns The cleaned URL without query params, hash, and file extension
 *
 * @example
 * cleanUrl('https://example.com/page.html?param=value#section')
 * // Returns: 'https://example.com/page'
 *
 * cleanUrl() // Uses current page URL
 * // Returns: 'https://currentsite.com/current-page'
 */
export function cleanUrl(url?: string) {
	// Use current page URL if none provided
	if (!url) {
		url = window.location.origin + window.location.pathname
	}

	const urlObj = new URL(url)
	let pathname = urlObj.pathname

	// Remove file extension
	const lastSlashIndex = pathname.lastIndexOf('/')
	const lastDotIndex = pathname.lastIndexOf('.')

	// Only remove extension if dot comes after last slash (it's a file, not a directory)
	if (lastDotIndex > lastSlashIndex && lastDotIndex !== -1) {
		pathname = pathname.substring(0, lastDotIndex)
	}

	return urlObj.origin + pathname
}

/**
 * Triggers a file download in the browser with the specified filename and content.
 *
 * @param filename - The name for the downloaded file (e.g., 'report.txt').
 * @param content - The content of the file. Can be a string or other Blob-compatible data.
 * @param blobType - The MIME type of the content (e.g., 'text/plain', 'application/json').
 *
 * @example
 * downloadFile('hello.txt', 'Hello, world!');
 */
export function downloadFile(filename: string, content: string | Blob, blobType = 'text/plain'): void {
	const blob = content instanceof Blob ? content : new Blob([content], { type: blobType })
	const url = URL.createObjectURL(blob)

	Object.assign(document.createElement('a'), {
		href: url,
		download: filename,
	}).click()

	URL.revokeObjectURL(url)
}
