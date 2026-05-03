# Scheduled Tasks

Run AI tasks on a schedule from TOML files. Each run loads one task definition, executes it with the configured OpenAI model and tools, and sends the final text output to the configured notification channels.

Typical uses:

- recurring research with web search
- personal summaries or digests
- calendar-aware assistants
- tasks that need continuity through a memory tool

Cron or any other scheduler is external to this project. This repository is the task runner.

## What It Does

For a single run, the runner:

1. loads a task from `--task-path`
2. validates the TOML structure
3. builds the requested tools
4. calls the OpenAI Responses API
5. sends the final text output to the requested notification channels

Current tools:

- `web_search`
- `google_calendar`
- `memories`

Current notification channels:

- `discord`
- `log`

## Setup

Install dependencies:

```bash
pnpm install
```

Build:

```bash
pnpm exec tsc
```

Run:

```bash
node dist/index.js --task-path .tasks/example.toml
```

The CLI also accepts `-c` as a short form of `--task-path`.

## Environment

The app loads environment variables from `.env` at startup.

Required by the app today:

```env
OPENAI_API_KEY=
GOOGLE_CALENDAR_REFRESH_TOKEN=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
MEMORIES_MCP_API_KEY=
DISCORD_WEBHOOK_URL=
```

Important behavior:

- `OPENAI_API_KEY` is always required.
- `DISCORD_WEBHOOK_URL` is required only when a task uses the `discord` notification channel.
- Google Calendar env vars are required only when a task uses `google_calendar`.
- `MEMORIES_MCP_API_KEY` is required only when a task uses `memories`.

## Task File

Tasks are defined as TOML files. Reusable examples can live under `.tasks/`.

Required fields:

- `task_name`
- `prompt`
- `model`
- `effort`
- `tool_names`
- `notification_channels`

Optional fields:

- `system_prompt`
- `notifications`
- `web_search`

### Supported Values

`effort`:

- `none`
- `minimal`
- `low`
- `medium`
- `high`
- `xhigh`

Known `model` values:

- `gpt-5.4`
- `gpt-5.4-mini`

Unknown model strings are allowed, but the loader warns about them.

`tool_names`:

- `web_search`
- `google_calendar`
- `memories`

`notification_channels`:

- `discord`
- `log`

`web_search.search_context_size`:

- `low`
- `medium`
- `high`

`web_search.user_location.type`:

- `approximate`

### Example

```toml
task_name = "Weekly Brno social events"
system_prompt = """
You are running as a scheduled task.
Be concise, practical, and avoid repeating past recommendations if memory helps.
"""
model = "gpt-5.4"
effort = "high"
tool_names = ["web_search", "google_calendar", "memories"]
notification_channels = ["discord", "log"]
prompt = """
Find interesting social events in Brno next week for a 21-year-old.
Prioritize places where meeting new people is realistic.
If suitable events are found, add them to Google Calendar and keep memory notes useful for the next run.
"""

[notifications.log]
file_path = "./logs/weekly-brno-social-events.notifications.log"

[web_search]
search_context_size = "high"

[web_search.user_location]
type = "approximate"
country = "CZ"
city = "Brno"
region = "South Moravian"
```

## Task Reference

### `task_name`

Free-form name used in notifications.

### `prompt`

The main user input sent to the model.

### `system_prompt`

Optional instructions sent as the model `instructions`. The runner appends the current date to this field automatically.

### `model`

The model passed directly to the OpenAI Responses API.

### `effort`

Mapped to `reasoning.effort` in the Responses API request.

### `tool_names`

Controls which tools are exposed to the model for the run.

### `notification_channels`

Controls where the final text output is sent.

### `notifications`

Optional channel-specific notification config.

Example:

```toml
[notifications.log]
file_path = "./logs/custom.notifications.log"
```

If a task uses the `log` notification channel and `notifications.log.file_path` is omitted, the runner writes
to `logs/<task-name-slug>.notifications.log` relative to the task file directory.

### `web_search`

Optional configuration for the `web_search` tool.

Example:

```toml
[web_search]
search_context_size = "medium"

[web_search.user_location]
type = "approximate"
country = "CZ"
city = "Prague"
region = "Prague"
```

If `web_search` is enabled but this section is omitted, the runner uses:

- `search_context_size = "medium"`
- `user_location = null`

## Tool Notes

### Web Search

- uses the built-in OpenAI `web_search` tool
- supports optional `search_context_size` and approximate user location

### Google Calendar

- uses local OpenAI function tools backed by the Google Calendar REST API
- refreshes an access token from `GOOGLE_CALENDAR_REFRESH_TOKEN`
- available capabilities include listing, getting, creating, updating, and deleting events

### Memories

- uses a remote MCP server labeled `note_management`
- authenticated by `MEMORIES_MCP_API_KEY`
- intended for task continuity across runs

## Notifications

### Discord

- sends the model's final text output to `DISCORD_WEBHOOK_URL`
- prefixes the first message with `Task: <task_name>`
- splits long outputs into multiple messages
- if the final output is empty, sends `Task finished without any text output.`

### Log

- writes the final output to a dedicated notification log file
- default path is `logs/<task-name-slug>.notifications.log` relative to the task file directory
- `notifications.log.file_path` can override the destination

## Development

Useful commands:

```bash
pnpm lint
pnpm typecheck
pnpm knip
pnpm format
pnpm format:check
pnpm exec tsc
```

There is no real test suite yet. Current validation is linting, typechecking, Knip, and running representative task files through the built CLI.
