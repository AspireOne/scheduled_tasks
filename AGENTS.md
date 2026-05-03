# Repository Guidelines

## Project Structure & Module Organization

Core application code lives in `src/`. Use `src/index.ts` as the CLI entrypoint, `src/runner.ts` for task execution, `src/ai/` for OpenAI client and tool wiring, `src/task/` for TOML task loading and validation, and `src/shared/` for CLI, env, logging, and utility helpers. Compiled output goes to `dist/`. Task definitions are expected as TOML files passed with `--task-path`; keep reusable task files under `.tasks/`. Reference material such as [`flow_diagram.png`](./flow_diagram.png) and the high-level overview live at the repo root.

## Build, Test, and Development Commands

Install dependencies with `pnpm install`.

- `pnpm lint` runs ESLint across the repo.
- `pnpm typecheck` runs `tsc --noEmit` with strict settings.
- `pnpm knip` reports unused files, exports, and dependencies.
- `pnpm format` rewrites files with Prettier.
- `pnpm format:check` verifies formatting without changing files.
- `pnpm exec tsc` builds TypeScript into `dist/`.
- `node dist/index.js --task-path .tasks/example.toml` runs a compiled task locally.

Husky pre-commit hooks already run Prettier on staged files plus `lint`, `knip`, and `typecheck` in parallel.

## Coding Style & Naming Conventions

This project uses TypeScript with ES modules and strict compiler checks. Follow the existing Prettier config: 100-column width, semicolons, double quotes, and trailing commas. Use 2-space indentation. Prefer `type` imports where possible; ESLint warns on inconsistent imports and unused variables unless prefixed with `_`. Keep filenames lowercase with hyphens only where already established; match the current patterns such as `task-loader.ts`, `openai-client.ts`, and `task.type.ts`.

## Testing Guidelines

There is no automated test suite yet; `pnpm test` is currently a placeholder and should not be treated as a quality gate. For now, validate changes with `pnpm lint`, `pnpm typecheck`, and `pnpm knip`, then run a representative task file through the built CLI. When adding tests later, place them alongside the feature or in a dedicated test directory and name them clearly after the module under test.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commits such as `feat(ai): ...`, `refactor(task): ...`, and `chore: ...`. Keep using that format, optionally with a scope, and include a commit body. Stage and commit only the files relevant to your change. Pull requests should describe behavior changes, note any task or env updates, link related issues, and include sample task input or output when the change affects runtime behavior.
