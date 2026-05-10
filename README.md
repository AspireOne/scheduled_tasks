# Scheduled Tasks

Run AI tasks from TOML files.

This project lets you define AI tasks as simple config files (see below).

It's useful for both one-off tasks (you can leverage notifications, tools like google calendar / web search / memories etc. easily), and recurring tasks. Example use cases:

- Weekly local discovery prompts for Brno: overlooked seasonal spots, views, cafés, walks, exhibitions, and one place worth visiting.
- Small positive check-ins: one good news item and one affordable weekend idea to make life feel richer.
- Seasonal city recommendations: one especially good thing to do in Brno this week of the year.
- Brno stories worth knowing: a fun local story, scandal, invention, or historical moment plus a place tied to it.
- Weekend conversation starters spanning science, culture, business, local Czech news, and something unusual.
- Weekly reflection workflows that ask review questions, summarize answers, and keep durable notes over time.
- Ongoing "expand my thinking" recommendations: unusual ideas, tools, books, papers, or emerging trends logged historically.
- Event research runs that find upcoming Brno social opportunities and optionally push them into Google Calendar.

## How It Works

1. You write a TOML task file.
2. For a one-off run, you invoke the runner with `--task-path`.
3. For recurring runs, you keep a long-running process running; the scheduler scans the task directory at boot and schedules every task with a `cron` field.
4. When a task fires, the runner loads it, calls the OpenAI Responses API, and forwards the final output to the configured notification channels.

## Example Config

See more example tasks live in [`tasks-examples/`](./tasks-examples/).

`/social-events-research.toml`:

```toml
task_name = "Weekly Brno social events"
cron = "0 9 * * 1"
model = "gpt-5.4"
effort = "high"
tool_names = ["web_search", "google_calendar", "memories"]
notification_channels = ["discord", "log"]
# Required when "discord" is in notification_channels. Channel the task posts to
# and (when the bot is running) listens to for replies.
discord_channel_id = "1234567890"

prompt = """
Find interesting social events in Brno next week.
Prioritize places where meeting new people is realistic.
If suitable events are found, add them to Google Calendar and keep memory notes useful for the next run.
"""
# Optional. System prompt is always augmented with current date.
system_prompt = """
You are running as a scheduled task.
Be concise, practical, and avoid repeating past recommendations if memory helps.
"""

# Optional. Standard 5-field cron expression used by the always-on bot process.
# Example above: every Monday at 09:00 in the server's local time zone.

# Optional: notification-specific config.
[notifications.log]
file_path = "./logs/weekly-brno-social-events.notifications.log"

# Optional: web search config.
[web_search]
search_context_size = "high"

# Optional: approximate user location for web search.
[web_search.user_location]
type = "approximate"
country = "CZ"
city = "Brno"
region = "South Moravian"
```

## Setup

Install dependencies: `pnpm install`

Run one task directly:

```bash
pnpm dlx tsx src/index.ts --task-path .tasks/social-events-research.toml
```

Or build the project:

```bash
pnpm exec tsc
```

And then:

```bash
node dist/index.js --task-path .tasks/social-events-research.toml
```

`-c` also works as a short form of `--task-path`.

You can also pass a default task config:

```bash
pnpm dlx tsx src/index.ts --task-path .tasks/my-task.toml --defaults .tasks/defaults.toml
```

Defaults files use the same TOML format as task files. Values from the task file always win, and
missing task values are filled from the defaults file. Nested tables are deep-merged, while arrays
replace the default array instead of concatenating with it. If `.tasks/defaults.toml` exists, it is
used automatically for tasks in `.tasks`; pass `--defaults` to use a different defaults file.

## Recommended Commands

For day-to-day local use with `tsx`:

```bash
pnpm dlx tsx src/index.ts --task-path .tasks/my-task.toml
pnpm dlx tsx src/scheduler.ts
pnpm dlx tsx src/bot.ts
pnpm dlx tsx src/server.ts
```

Use `src/scheduler.ts` for cron only, `src/bot.ts` for Discord only, and `src/server.ts` to run both together.

To print crontab entries for all cron-enabled tasks in a directory:

```bash
pnpm dlx tsx src/print-crontab.ts --tasks-dir .tasks
pnpm dlx tsx src/print-crontab.ts --tasks-dir .tasks --defaults .tasks/defaults.toml
pnpm print-crontab:dev --tasks-dir .tasks
```

Each output line contains the task cron expression, the absolute path to `run-task.sh`, and the
absolute path to the task TOML file. If defaults are active, the defaults file path is emitted as a
second `run-task.sh` argument. You can redirect the output into a crontab workflow if you want to
manage scheduling outside the built-in scheduler.

## Long-Running Modes

There are three supported long-running modes:

1. Scheduler only: scans the tasks directory and runs cron-enabled tasks.
2. Bot only: listens for Discord replies and continues conversational tasks.
3. Combined server: runs both in one process.

Run them like this:

```bash
pnpm dlx tsx src/scheduler.ts                   # scheduler only, development
node dist/scheduler.js                          # scheduler only, production

pnpm dlx tsx src/bot.ts                         # Discord bot only, development
node dist/bot.js                                # Discord bot only, production

pnpm dlx tsx src/server.ts                      # scheduler + bot, development
node dist/server.js                             # scheduler + bot, production
node dist/server.js --mode scheduler            # explicit scheduler-only mode
node dist/server.js --mode bot                  # explicit bot-only mode
node dist/server.js --tasks-dir ./other-tasks   # custom tasks dir (default .tasks)
node dist/server.js --defaults ./defaults.toml  # custom defaults file
```

`src/scheduler.ts` and `src/bot.ts` are just thin dedicated entrypoints. `src/server.ts` is the combined entrypoint and defaults to `--mode all`.

## Conversational Tasks (Discord Bot)

Tasks can be continued via Discord. After a task runs, its Discord message id is stored, and replies in the configured channel are forwarded back to the model as a continuation of the same conversation.

To enable replies:

1. Create a Discord application + bot user, copy the bot token into `DISCORD_BOT_TOKEN` in `.env`.
2. Invite the bot to your server with permissions to read and send messages in the relevant channels.
3. Set `discord_channel_id` on each task that should be conversational.
4. Run the bot process, or the combined server if you also want cron scheduling in the same process.

The combined server scans the tasks directory at startup and:

1. schedules every task with a `cron` expression
2. builds a `channel_id → task` map for channels that are uniquely assigned

If multiple tasks share the same `discord_channel_id`, the bot ignores replies in that channel. If a cron-triggered task is still running when its next scheduled time arrives, that overlapping run is skipped. Each scheduled run replaces the prior conversation thread.

Cron uses standard 5-field expressions in the server's local time zone:

```text
* * * * *
- - - - -
| | | | |
| | | | day of week (0-7, Sunday is 0 or 7)
| | | month (1-12)
| | day of month (1-31)
| hour (0-23)
minute (0-59)
```

You can also continue a conversation from the CLI:

```bash
node dist/index.js --task-path .tasks/weekly-review.toml --continue -m "your reply"
```

## Dev Notes

- Environment: The app loads environment variables from `.env`. See `.env.example` for required variables.
- See package.json for scripts.
- There's a husky pre-commit hook.
