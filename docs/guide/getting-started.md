# Getting Started

## Install

::: code-group

```sh [npm]
npm install vitepress-plugin-llms --save-dev
```

```sh [yarn]
yarn add vitepress-plugin-llms --save-dev
```

```sh [pnpm]
pnpm add vitepress-plugin-llms --save-dev
```

```sh [bun]
bun add vitepress-plugin-llms --dev
```

:::

## Add plugin

::: code-group

```ts [.vitepress/config.ts]
import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
	// ...
	vite: {
		plugins: [llmstxt()], // [!code ++]
	},
});
```

:::
