# Repository Guidelines

## Project Structure & Module Organization

`src/` contains the runtime code, split by domain: `ai/`, `calendar/`, `notifications/`, `task/`, and `shared/`. Entry points live in `src/index.ts` and `src/runner.ts`. Compiled output is written to `dist/`; treat it as generated code. Task examples and local inputs belong in `.tasks/`. Repository docs live in `README.md`, and `flow_diagram.png` provides a high-level reference.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies.
- `pnpm exec tsc` builds TypeScript into `dist/`.
- `pnpm lint` runs ESLint across the repo.
- `pnpm typecheck` runs `tsc --noEmit` for strict type validation.
- `pnpm knip` checks for unused files, exports, and dependencies.
- `pnpm format` applies Prettier; `pnpm format:check` verifies formatting.
- `node dist/index.js --task-path .tasks/example.toml` runs one scheduled task locally after build.

## Coding Style & Naming Conventions

This is a strict TypeScript project using ES modules. Use Prettier defaults from `.prettierrc.json`: 2-space indentation, semicolons, double quotes, trailing commas, and a 100-character line width. Keep modules focused by domain, prefer `kebab-case` file names such as `task-loader.ts`, and use `index.ts` only for clear module entry points. ESLint warns on `console`, unused variables, and enforces consistent type imports; prefer inline `type` imports and prefix intentionally unused parameters with `_`.

## Testing Guidelines

There is no dedicated test suite yet. Until one exists, treat `pnpm lint`, `pnpm typecheck`, and `pnpm knip` as the minimum verification set before opening a PR. If you add tests, keep them near the code they cover or in a small, clearly named test directory, and make the execution command explicit in `package.json`.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style seen in history, for example `feat(calendar): replace mcp calendar integration with direct api tools`. Include a body in every commit and stage only the files relevant to your change. PRs should explain the behavioral change, note any required env vars or task-file updates, and include a concrete validation summary such as `pnpm lint && pnpm typecheck && pnpm knip`.

## Security & Configuration Tips

Keep secrets in `.env` only; never commit API keys, refresh tokens, or webhook URLs. When changing task loading, tool wiring, or notifications, update `README.md` so supported TOML fields and required environment variables stay accurate.
