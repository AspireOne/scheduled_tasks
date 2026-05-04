# Scheduled Tasks

Run AI tasks from TOML files.

This project lets you define AI tasks as simple config files (see below).

It's useful for both one-off tasks (you can leverage notifications, tools like google calendar / web search / memories etc. easily), and recurring tasks. Example usecases when paired with a scheduler/cron:

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
2. Your scheduler runs this project with `--task-path`.
3. The runner loads the task, calls the OpenAI Responses API and handles all the underlying stuff, and forwards the final output to the configured notification channels.

## Example Config

See more example tasks live in [`tasks-examples/`](./tasks-examples/).

`/social-events-research.toml`:

```toml
task_name = "Weekly Brno social events"
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

Run directly:

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

## Conversational Tasks (Discord Bot)

Tasks can be continued via Discord. After a task runs, its Discord message id is stored, and replies in the configured channel are forwarded back to the model as a continuation of the same conversation.

To enable replies:

1. Create a Discord application + bot user, copy the bot token into `DISCORD_BOT_TOKEN` in `.env`.
2. Invite the bot to your server with permissions to read and send messages in the relevant channels.
3. Set `discord_channel_id` on each task that should be conversational.
4. Run the bot process alongside your scheduler:

```bash
pnpm bot:dev                 # development
node dist/bot.js             # production (after pnpm exec tsc)
node dist/bot.js --tasks-dir ./other-tasks  # custom tasks dir (default .tasks)
```

The bot scans the tasks directory at startup and builds a `channel_id → task` map for channels that are uniquely assigned. If multiple tasks share the same `discord_channel_id`, the bot ignores replies in that channel. Each scheduled run replaces the prior conversation thread.

You can also continue a conversation from the CLI:

```bash
node dist/index.js --task-path .tasks/weekly-review.toml --continue -m "your reply"
```

## Dev Notes

- Environment: The app loads environment variables from `.env`. See `.env.example` for required variables.
- See package.json for scripts.
- There's a husky pre-commit hook.
