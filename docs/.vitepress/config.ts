import { defineConfig } from 'vitepress'
import {
	groupIconMdPlugin,
	groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	// srcDir: 'docs',
	title: 'My Awesome Project',
	description: 'A VitePress Site',
	lastUpdated: true,
	cleanUrls: true,
	themeConfig: {
		logo: { src: '/scroll.svg', width: 24, height: 24 },
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Examples', link: '/markdown-examples' },
		],

		sidebar: [
			{
				text: 'Examples',
				items: [
					{ text: 'Markdown Examples', link: '/markdown-examples' },
					{ text: 'Runtime API Examples', link: '/api-examples' },
				],
			},
		],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/vuejs/vitepress' },
		],
	},
	vite: {
		plugins: [groupIconVitePlugin()],
	},
})
