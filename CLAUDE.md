# Workflow

When asked to do work in this repo, follow this flow end-to-end without waiting for extra confirmation between steps.

**Rule: one session = one branch.** Only create a new branch when either:
- this is the start of a new session (no branch has been created yet this session), or
- the user explicitly asks to start a new branch.

Otherwise, if a branch was already created earlier in this session, keep reusing it for every subsequent request — do not create a new branch per request.

1. **Branch** (new session, or explicitly requested): Create a new branch off the current base branch (usually `master`), named as a short kebab-case slug describing the task (e.g. `add-auth-tests`, `fix-login-bug`). Use `mcp__github__create_branch`. Remember this branch for the rest of the session.
2. **Work**: Make the requested changes locally on the session's current branch.
3. **Commit & push**: Once the work is complete (and passes any relevant checks/tests), push the changed files to that branch using the GitHub MCP server's `mcp__github__push_files` tool — do not rely on local `git push`. Write a concise commit message describing the change.
4. **Pull request**: 
   - If no PR exists yet for this session's branch, open one immediately after pushing via `mcp__github__create_pull_request`, targeting the base branch, with a clear title and a short description of what changed and why. Don't wait for approval to open it — it's meant for review, not pre-review sign-off.
   - If a PR was already opened earlier in this session for the current branch, don't open another one — the new commit will simply appear on the existing PR.

Always end by sharing the PR URL.

## Frontend visual changes

When a PR includes frontend work that produces a visual change (new UI, layout change, styling change), include a screenshot of the change in the PR description before opening or updating the PR. Do not commit screenshot files to the repo — the screenshot should only appear embedded in the PR description (e.g. via drag-and-drop/paste into the PR body on GitHub).
