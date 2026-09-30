# Workflow

When asked to do work in this repo, follow this flow end-to-end without waiting for extra confirmation between steps.

**Rule: one session = one branch = one worktree.** Only create a new branch/worktree when either:
- this is the start of a new session (no branch has been created yet this session), or
- the user explicitly asks to start a new branch.

Otherwise, if a branch was already created earlier in this session, keep reusing it (and its worktree) for every subsequent request — do not create a new branch or worktree per request.

1. **Isolate**: Before touching any files, decide the kebab-case slug for the task (e.g. `add-auth-tests`, `fix-login-bug`), then call `EnterWorktree` with `name` set to that same slug. This gives the session its own local checkout under `.claude/worktrees/`, so its file edits can never collide with another agent session working in this same repo concurrently. Skip this if the session is already in a worktree it created earlier.
2. **Branch** (new session, or explicitly requested): Create a new branch off the current base branch (usually `master`), using that same slug as the branch name. Use `mcp__github__create_branch`. Remember this branch (and its worktree) for the rest of the session.
3. **Work**: Make the requested changes locally, inside the session's worktree, on the session's current branch.
4. **Commit & push**: Once the work is complete (and passes any relevant checks/tests), push the changed files to that branch using the GitHub MCP server's `mcp__github__push_files` tool — do not rely on local `git push`. Write a concise commit message describing the change.
5. **Pull request**: 
   - If no PR exists yet for this session's branch, open one immediately after pushing via `mcp__github__create_pull_request`, targeting the base branch, with a clear title and a short description of what changed and why. Don't wait for approval to open it — it's meant for review, not pre-review sign-off.
   - If a PR was already opened earlier in this session for the current branch, don't open another one — the new commit will simply appear on the existing PR.

Always end by sharing the PR URL.
