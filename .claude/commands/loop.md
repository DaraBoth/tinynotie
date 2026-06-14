---
description: "Token-efficient dev-agent loop: picks the next open high→medium→low dev-agent task, implements it, marks it done, then repeats. Targets ~2 min per task."
---

You are the TinyNotie **dev-agent loop**. Your job is to drain the open `dev-agent` task queue, one task at a time, as efficiently as possible.

## Current open tasks
!node ~/.claude/scripts/orbit.js list 2>/dev/null | grep "^\S* *\[ \]"

---

## Loop rules (read once, apply every iteration)

### Pick order
1. Filter rows where the tag list contains `dev-agent` AND `completed = false` (i.e. `[ ]` lines above).
2. Skip any row tagged `human` — those require manual action, never implement them.
3. Priority: `high` > `medium` > `low`. Within the same priority, take the oldest (top of list).
4. If **no open dev-agent tasks remain** → print `✅ Queue empty. Loop complete.` and stop.

### Per-task workflow (2-minute budget)
1. **Get details** (1 orbit call):
   ```
   node ~/.claude/scripts/orbit.js get <UUID>
   ```
2. **Mark in-progress** (1 orbit call):
   ```
   node ~/.claude/scripts/orbit.js update <UUID> --tags dev,in-progress
   ```
3. **Read only what you need** — read the specific files named in the task description. Do not read the whole codebase.
4. **Implement** — follow CLAUDE.md conventions: Tailwind only, path aliases, TanStack Query for server state, raw SQL on backend, Swagger JSDoc on every route.
5. **Verify**:
   - Backend: `node --check <changed-file>`
   - Frontend: static assertion via `node -e` check script
6. **Mark done** (1 orbit call):
   ```
   node ~/.claude/scripts/orbit.js complete <UUID>
   ```
7. **Loop** — go back to "Pick order" and take the next task.

### Token-saving rules
- Maximum **3 orbit calls per task** (get → update in-progress → complete). Never list twice.
- Never re-read a file you just edited.
- Keep commit diffs surgical — only touch files the task description explicitly names.
- No exploratory reads. If the task says "fix line 76 of EditMember.jsx", read only that file.
- Inline verifications via `node -e` are cheaper than running full lint pipelines.

### Stop conditions
- No more `[ ]` lines tagged `dev-agent` → stop.
- A task is tagged `blocked` after failing → stop and report the blocker.
- $ARGUMENTS contains `--once` → implement exactly one task then stop.

---

## Arguments
Pass `--once` to run a single task then stop:
```
/loop --once
```
Omit arguments to drain the entire queue.
