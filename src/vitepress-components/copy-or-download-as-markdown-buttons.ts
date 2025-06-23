import { cleanUrl, downloadFile } from './utils'

//#region SVG Icons
const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`
const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>`
//#endregion

/**
 * Temporarily updates the button to show a success state with a checkmark icon.
 *
 * Replaces the button's icon with a checkmark and restores the original icon after 2 seconds.
 *
 * @param button - The button element to update.
 */
function showSuccessState(button: HTMLButtonElement): void {
	const icon = button.querySelector('svg') as unknown as HTMLElement
	const originalIcon = icon.innerHTML

	icon.innerHTML = checkIcon

	// Restore original content after 2 seconds
	setTimeout(() => {
		icon.innerHTML = originalIcon
	}, 2000)
}

/**
 * Copies markdown content from the current page to clipboard
 * Shows success feedback on the copy button
 */
function copyMarkdown(): void {
	const copyButton = document.querySelector('.markdown-copy-buttons .copy') as HTMLButtonElement
	if (!copyButton) return

	const url = `${cleanUrl()}.md`

	fetch(url)
		.then((response) => response.text())
		.then((text) => navigator.clipboard.writeText(text))
		.then(() => {
			showSuccessState(copyButton)
		})
		.catch((error) => console.error('Error copying markdown:', error))
}

/**
 * Downloads markdown content from the current page as a file
 * Shows success feedback on the download button
 */
function downloadMarkdown(): void {
	const downloadButton = document.querySelector('.markdown-copy-buttons .download') as HTMLButtonElement
	if (!downloadButton) return

	const cleanedUrl = cleanUrl()
	const url = `${cleanedUrl}.md`

	fetch(url)
		.then((response) => response.text())
		.then((text) => {
			downloadFile(`${cleanedUrl.split('/').pop()}.md`, text, 'text/markdown')
			showSuccessState(downloadButton)
		})
		.catch((error) => console.error('Error downloading markdown:', error))
}

/**
 * Adds markdown copy and download buttons to the page
 * Inserts buttons after the first h1 element in the document
 * Includes styling and event handlers for both buttons
 */
function addCopyOrDownloadAsMarkdownButtons(): void {
	const h1 = document.querySelector('.vp-doc h1')
	if (!h1) return

	const existing = document.querySelector('.markdown-copy-buttons')
	if (existing) existing.remove()

	const buttonsDiv = document.createElement('div')
	const style = document.createElement('style')
	style.textContent = `
	.markdown-copy-buttons {
		width: 100%;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin-bottom: 16px;
	}
	.markdown-copy-buttons button {
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: background 0.2s, border 0.2s;
	}
	.markdown-copy-buttons button:hover {
		color: white;
	}
	.markdown-copy-buttons svg {
		vertical-align: middle;
	}`

	document.head.appendChild(style)
	buttonsDiv.className = 'markdown-copy-buttons'
	buttonsDiv.innerHTML = `
	<div style="margin: 16px 0; display: flex; gap: 12px;">
	  <button class="copy">
		${copyIcon} Copy as Markdown
	  </button>
	  <button class="download">
		${downloadIcon} Download as Markdown
	  </button>
	</div>
  `

	h1.after(buttonsDiv)

	buttonsDiv.querySelector('.copy')?.addEventListener('click', copyMarkdown)
	buttonsDiv.querySelector('.download')?.addEventListener('click', downloadMarkdown)
}

export default addCopyOrDownloadAsMarkdownButtons
