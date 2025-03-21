# Contributing Guidelines

Thank you for your interest in helping this project 🙌

Here are some instructions to help you with this project

## Conventional Commits

This project uses [Conventional Commit format](https://www.conventionalcommits.org/en/v1.0.0/) to automatically generate a changelog and better understand the changes in the project

Here are some examples of conventional commit messages:

- `feat: add new functionality`
- `fix: correct typos in code`
- `ci: add GitHub Actions for automated testing`

## Conventional PR Titles

The title of your pull request should follow the [conventional commit format](#conventional-commits). When a pull request is merged to the main branch, all changes are going to be squashed into a single commit. The message of this commit will be the title of the pull request. And for every release, the commit messages are used to generate the changelog.

## Development Setup

We use [**Bun**](https://bun.sh) as our package manager and runtime.

If you don't have it - you can install it using the command specified on the page <https://bun.sh>

After cloning the repository, install the required packages:

```bash
bun install
```

### Building

```bash
bun run build
```

### Testing

The tests are run using the built-in test framework **Bun**, to run the tests, execute this command:

```bash
bun run test
```

## Install Unreleased Versions

This repo uses <https://pkg.pr.new> to publish versions of all it's packages for almost every commit. You can install them via:

```sh
npm i https://pkg.pr.new/[package-name]@[ref]
```

Or use one of the shorthands:

```sh
# Install the latest build of `vitepress-plugin-llms` from a PR:
npm i https://pkg.pr.new/vitepress-plugin-llms@1283

# Install the latest build of `vitepress-plugin-llms` on the `main` branch
npm i https://pkg.pr.new/vitepress-plugin-llms@main

# Install `vitepress-plugin-llms` from a specific commit:
npm i https://pkg.pr.new/vitepress-plugin-llms@426f907
```

If you encounter any problems - feel free to open a new issue - <https://github.com/okineadev/vitepress-plugin-llms/issues/new/choose>
