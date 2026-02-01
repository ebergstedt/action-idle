# Git Push

Add all changes, create a commit with a descriptive message, and push to the remote repository.

## Instructions

1. Run `git status` to see all changed and untracked files
2. Run `git diff --staged` and `git diff` to understand the changes
3. Run `git log -3 --oneline` to see recent commit message style
4. Analyze the changes and create a clear, concise commit message that:
   - Summarizes the nature of changes (feat, fix, chore, refactor, docs, test, etc.)
   - Focuses on the "why" not just the "what"
   - Is 1-2 sentences max
5. Stage all changes with `git add -A`
6. Create the commit using a HEREDOC for the message:
   ```bash
   git commit -m "$(cat <<'EOF'
   Your commit message here.

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```
7. Push to remote with `git push` (or `git push -u origin <branch>` if needed)
8. Report the commit hash and confirm the push succeeded

## Safety Rules

- Never force push
- Never push to main/master without explicit permission
- If there are merge conflicts, stop and ask the user
- Do not commit files that look like secrets (.env, credentials, keys)
