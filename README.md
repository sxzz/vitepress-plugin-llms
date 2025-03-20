<div align="center">

  [![Banner](https://raw.githubusercontent.com/okineadev/vitepress-plugin-llms/refs/heads/main/assets/banner.png)](https://npmjs.com/package/vitepress-plugin-llms)

# 📜 vitepress-plugin-llms

[![NPM Downloads](https://img.shields.io/npm/dw/vitepress-plugin-llms?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSIyNHB4IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNNDgwLTMyMCAyODAtNTIwbDU2LTU4IDEwNCAxMDR2LTMyNmg4MHYzMjZsMTA0LTEwNCA1NiA1OC0yMDAgMjAwWk0xNjAtMTYwdi0yMDBoODB2MTIwaDQ4MHYtMTIwaDgwdjIwMEgxNjBaIi8%2BPC9zdmc%2B&labelColor=FAFAFA&color=212121)](https://www.npmjs.com/package/vitepress-plugin-llms) [![NPM Version](https://img.shields.io/npm/v/aboutproject?logo=npm&logoColor=212121&label=version&labelColor=FAFAFA&color=212121)](https://npmjs.com/package/aboutproject) [![Tests Status](https://img.shields.io/github/actions/workflow/status/okineadev/vitepress-plugin-llms/ci.yml?label=tests&labelColor=212121)](https://github.com/okineadev/vitepress-plugin-llms/actions/workflows/ci.yml) [![Built with Bun](https://img.shields.io/badge/Built_with-Bun-fbf0df?logo=bun&labelColor=212121)](https://bun.sh) [![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome&labelColor=212121)](https://biomejs.dev/) [![sponsor](https://img.shields.io/badge/sponsor-EA4AAA?logo=githubsponsors&labelColor=FAFAFA)](https://github.com/okineadev/vitepress-plugin-llms?sponsor=1)
</div>

## 📦 Installation

```bash
bun install vitepress-plugin-llms --dev
npm install vitepress-plugin-llms --save-dev
```

## 🛠️ Usage

Add the Vite plugin to your VitePress configuration (`.vitepress/config.ts`):

```ts
import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
  vite: {
    plugins: [llmstxt()],
  },
});
```

Done!

Now, thanks to this plugin, the LLM version of the website documentation is automatically generated

### Plugin Settings

See [`src/types.d.ts`](src/types.d.ts)

## 🚀 Why `vitepress-plugin-llms`?

LLMs (Large Language Models) are great at processing text, but traditional documentation formats can be too heavy and cluttered. `vitepress-plugin-llms` generates raw Markdown documentation that LLMs can efficiently process

The file structure in `.vitepress/dist` folder will be as follows:

```plaintext
.vitepress/dist
├── ...
├── llms-full.txt            // A file where all the website documentation is compiled into one file
├── llms.txt                 // The main file for LLMs with all links to all sections of the documentation for LLMs
├── markdown-examples.html   // A human-friendly version of `markdown-examples` section in HTML format
└── markdown-examples.md     // A LLM-friendly version of `markdown-examples` section in Markdown format
```

### ✅ Key Features

- ⚡️ Easy integration with VitePress
- 🤖 An LLM-friendly version is generated for each page
- 📝 Outputs `llms.txt` with section links
- 📖 Outputs `llms-full.txt` with all content in one file

## 📖 llmstxt.org Standard

This plugin follows the [llmstxt.org](https://llmstxt.org/) standard, which defines the best practices for LLM-friendly documentation.

## ❤️ Support

If you like this project, consider supporting it by starring ⭐ it on GitHub, sharing it with your friends, or [buying me a coffee ☕](https://github.com/okineadev/vitepress-plugin-llms?sponsor=1)

## 📜 License

[MIT License](./LICENSE) © 2025-present [Yurii Bogdan](https://github.com/okineadev)
