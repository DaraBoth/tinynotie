---
name: "orbit-api"
description: "Gives an AI agent full read/write access to Orbit tasks on DailyGoalMap. Covers auth, all MCP tool calls (list/create/update/move/complete/delete), token management, and the local orbit.js CLI helper."
---

# Orbit Task API Skill

## What this skill gives you

Full read/write access to tasks inside **one specific goal** on [DailyGoalMap](https://dailygoalmap.vercel.app) via the Orbit Task API.
The API key is goal-scoped — it can only touch tasks belonging to the goal it was generated for.

---

## 1. Token (API Key) Setup

### Where the key lives

Key resolution order (the CLI and all agents use the same logic):

1. `ORBIT_API_KEY` in the **project root `.env`** (preferred — checked first)
2. `ORBIT_API_KEY` **environment variable**

### Save the key for this project

Add to `<project-root>/.env` (create the file if it doesn't exist):

```
ORBIT_API_KEY=dgm_your_key_here
```

> **Never commit `.env` to git.** Confirm `.env` is in `.gitignore` before saving the key.

### How to generate a key

Inside the DailyGoalMap app: **Goal → Settings tab → API section → Generate Project Key**.
The key format is `dgm_...`.

### Auth header (when calling the API directly)

```
X-Project-Api-Key: YOUR_ORBIT_API_KEY
```

`Authorization: Bearer YOUR_ORBIT_API_KEY` is also accepted for tools that require standard Bearer format.

---

## 2. Calling the API — two styles

| Style | Endpoint | Best for |
|---|---|---|
| MCP tool call | `POST /api/mcp` | AI agents (this skill) |
| Direct REST | `GET\|POST\|PUT\|PATCH\|DELETE /api/project-tasks` | Scripts, curl |

All examples in this skill use the **MCP style** (recommended for agents).

Base URL: `https://dailygoalmap.vercel.app`

---

## 3. MCP Tool Reference

### 3.1 `tasks.list` — read tasks

```json
{
  "tool": "tasks.list",
  "input": {
    "date": "2026-06-14",
    "completed": false,
    "limit": 50,
    "offset": 0,
    "tags": ["work"],
    "match": "any"
  }
}
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `limit` | number | 200 | Max 500 |
| `offset` | number | 0 | Pagination |
| `date` | `"YYYY-MM-DD"` | — | Tasks whose `start_date` falls on this UTC day |
| `date_from` | `"YYYY-MM-DD"` | — | start_date on or after this day |
| `date_to` | `"YYYY-MM-DD"` | — | start_date on or before this day |
| `completed` | boolean | — | `false` = incomplete only, `true` = completed only |
| `tags` | string[] | — | Filter by tags |
| `match` | `"any"` \| `"all"` | `"any"` | Tag matching mode |

> **Always use `date` or `date_from`/`date_to`** when you only need a specific period. Paginate only when needed.

---

### 3.2 `tasks.create` — create a task

```json
{
  "tool": "tasks.create",
  "input": {
    "title": "Review roadmap",
    "description": "Go through Q3 goals",
    "start_date": "2026-06-14T09:00:00Z",
    "end_date": "2026-06-14T10:00:00Z",
    "daily_start_time": "09:00:00",
    "daily_end_time": "10:00:00",
    "tags": ["work"],
    "completed": false
  }
}
```

Only `title` is required. Returns `{ "task": { ...task } }` with HTTP 201.

---

### 3.3 `tasks.update` — edit a task

```json
{
  "tool": "tasks.update",
  "input": {
    "task_id": "uuid-of-the-task",
    "title": "New title",
    "completed": true,
    "tags": ["done"]
  }
}
```

`task_id` is required. All other fields are optional — only provided fields are changed.
`tags` replaces existing tags entirely; pass `null` to clear all tags.

---

### 3.4 `tasks.move` — reschedule date/time only

```json
{
  "tool": "tasks.move",
  "input": {
    "task_id": "uuid-of-the-task",
    "start_date": "2026-06-15T09:00:00Z",
    "end_date": "2026-06-15T10:00:00Z",
    "daily_start_time": "09:00:00",
    "daily_end_time": "10:00:00"
  }
}
```

Returns `{ "task": { ... }, "moved": true }`.

---

### 3.5 `tasks.complete` — toggle completion

```json
{
  "tool": "tasks.complete",
  "input": {
    "task_id": "uuid-of-the-task",
    "completed": true
  }
}
```

`completed` defaults to `true` if omitted.

---

### 3.6 `tasks.delete` — delete a task

```json
{
  "tool": "tasks.delete",
  "input": {
    "task_id": "uuid-of-the-task"
  }
}
```

Returns `{ "ok": true, "result": { "success": true, "deleted_task_id": "..." } }`.

---

## 4. Task Object Shape

```json
{
  "id": "uuid",
  "goal_id": "uuid",
  "title": "Task title",
  "description": "Task description",
  "completed": false,
  "start_date": "2026-06-14T09:00:00+00:00",
  "end_date": "2026-06-14T10:00:00+00:00",
  "daily_start_time": "09:00:00",
  "daily_end_time": "10:00:00",
  "is_anytime": false,
  "duration_minutes": 60,
  "tags": ["work"],
  "created_at": "2026-06-07T12:00:00+00:00",
  "updated_at": "2026-06-07T12:00:00+00:00",
  "updated_by": "user-uuid"
}
```

---

## 5. Local CLI Helper (`orbit.js`)

A Node.js CLI is installed at `~/.claude/scripts/orbit.js`. It auto-loads `ORBIT_API_KEY` from the project `.env`.

```powershell
# List today's incomplete tasks
node $HOME/.claude/scripts/orbit.js list --date 2026-06-14 --completed false

# Create a task
node $HOME/.claude/scripts/orbit.js create --title "Fix login bug" --tags bug,backend

# Mark a task complete
node $HOME/.claude/scripts/orbit.js complete <UUID>

# Update a task
node $HOME/.claude/scripts/orbit.js update <UUID> --title "New title" --completed false

# Move/reschedule
node $HOME/.claude/scripts/orbit.js move <UUID> --start 2026-06-15T09:00:00Z --end 2026-06-15T10:00:00Z

# Delete a task
node $HOME/.claude/scripts/orbit.js delete <UUID>

# Inspect a single task (pretty JSON)
node $HOME/.claude/scripts/orbit.js get <UUID>
```

---

## 6. Recommended Agent Workflow

1. Call `tasks.list` to fetch current tasks and their UUIDs.
2. Use the `id` field from results as `task_id` in update/move/delete calls.
3. **Never invent or guess task UUIDs** — always fetch first.
4. Use `tasks.create` for new tasks, `tasks.update` for field edits, `tasks.move` for rescheduling only.
5. Use `tasks.complete` as a quick toggle without touching other fields.

---

## 7. Error Responses

```json
{ "ok": false, "error": "description of what went wrong" }
```

| Status | Meaning |
|---|---|
| 400 | Missing/invalid input (e.g. missing `title`, missing `task_id`) |
| 401 | Missing or invalid API key |
| 405 | Method not allowed |
| 500 | Server or database error |

---

## 8. Token Safety Rules

- **Never log or print the raw API key.**
- **Never hardcode the key** in agent files, scripts, or source code.
- Keep the key only in `.env` (project root) or as a shell environment variable.
- If the key is compromised, regenerate it in the DailyGoalMap app immediately.
- Confirm `.env` is in `.gitignore` before committing anything.
