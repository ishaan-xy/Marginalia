# SimpleMD Test

Let me trace through the full round-trip to find where the branch context is being lost. The issue is: you commit to `notes/my-notes-md` (a branch), but when the file reloads, it loads from `main` instead of from the branch you just committed to.

Let me examine the commit flow and the post-commit state update:
The hook's `commit` function does update `branch: result.branch`. That looks correct. Now let me check the staleness check — it's the prime suspect. It fetches from `currentFile.branch`:
The staleness check uses `currentFile.branch` — that's correct IF the branch was properly set. But let me check the initial `openFile` — where does the branch come from when you first open a file?
**Found the root cause.** Line 234: when you open a file from the sidebar, `branch` is set to `selectedRepo.defaultBranch` (i.e., `main`). 

So here's the broken round-trip:

1. You open `README.md` from the sidebar → `currentFile.branch = "main"`, `sha = "abc123"`
2. You edit and commit → the Worker creates branch `notes/readme-md`, commits there, returns `result.branch = "notes/readme-md"`
3. The hook updates `currentFile.branch = "notes/readme-md"` ✅
4. You keep editing → `hasUncommittedChanges` compares against `originalContent` ✅
5. **But the staleness check (every 60s) fetches from `currentFile.branch` = `"notes/readme-md"`** ✅ — this is actually correct after commit
6. **The real problem**: when you click the file in the sidebar again (to "reload" it), `openFile` is called, which fetches from `selectedRepo.defaultBranch` = `"main"` — **not from the branch you committed to!**

So if you:
1. Open `README.md` (loads from `main`, SHA = `abc123`)
2. Edit + commit to `notes/readme-md` (SHA on branch = `def456`, but `main` still has `abc123`)
3. Click `README.md` in the sidebar again → `openFile` fetches from `main` → gets `abc123` (the OLD version, without your commit!)

Your commit is on the branch, but reloading from the sidebar loads from `main` where your commit doesn't exist yet (it's on the branch, pending PR merge).

**The fix**: `openFile` should check if there's already a `currentFile` for the same path, and if so, preserve the branch. OR better: the file tree should show which branch you're on, and opening a file should default to the branch you last used for it.

The cleanest fix: **track the active branch per-file**, and when opening a file, use the existing branch if there is one. Let me also check the Worker's `getFile` to make sure it respects the branch param:
Good — the Worker's `getFile` correctly uses the `branch` query param. The bug is purely in the hook's `openFile` always using `selectedRepo.defaultBranch`.

The fix: `openFile` should preserve the existing branch if you're reopening the same file, and also track a "last used branch" per path so reopening uses the branch context. Let me implement this:
Now update the `commit` function to remember the branch in `branchMemoryRef`:
Now there's another issue — the staleness check fetches from `currentFile.branch`, but after a commit, `currentFile.branch` is the commit branch. However, the staleness check compares `latest.sha !== currentFile.sha`. After a commit, `currentFile.sha` = `result.fileSha` (the new SHA on the branch), and `latest.sha` (fetched from the branch) = same SHA. So staleness should be fine.

But there's a subtle issue: the staleness check runs every 60s. If you commit, then 60s later the check runs, it fetches from the branch (correct) and compares SHAs (correct). That's fine.

The real remaining issue: **the file tree in the sidebar shows files from `main`** (the default branch). When you click a file, it now correctly loads from the remembered branch. But the file tree itself doesn't show which branch you're on. Let me also make sure the status bar shows the correct branch. Let me check:
Good — the status bar already shows `currentFile.branch`, which is now correctly the commit branch after a commit. Let me lint and build:
Both clean. Let me commit and push.
Pushed to GitHub. Cloudflare Pages will auto-deploy in ~1 minute.

## The bug

When you committed to a branch (`notes/readme-md`), reopening the file from the sidebar loaded from `main` — where your commit doesn't exist yet (it's on the branch, pending PR merge). You'd see the old version and think your commit was lost.

**Root cause:** `openFile()` always fetched from `selectedRepo.defaultBranch` (main), ignoring the branch you just committed to.

## The fix: branch memory

Added a `branchMemoryRef` — a `Map` that remembers which branch each file was last committed to.

**Two changes:**

1. **`commit()`** now stores the branch after a successful commit:
   ```
   branchMemoryRef.set("owner/repo:README.md", "notes/readme-md")
   ```

2. **`openFile()`** checks the memory first. If there's a remembered branch for this file, it fetches from that branch instead of `main`. Falls back to `defaultBranch` for first-time opens.

## The round-trip now works

1. Open `README.md` → loads from `main` (SHA `abc123`)
2. Edit + commit → creates `notes/readme-md`, commits there (SHA `def456`)
   - Branch memory remembers: `README.md → notes/readme-md`
   - `currentFile.branch = notes/readme-md`
3. Click `README.md` in sidebar again → `openFile` checks memory → fetches from `notes/readme-md` (not `main`!) → loads SHA `def456` (your committed version) ✅

The staleness check and status bar already used `currentFile.branch`, so they were correct — the only bug was `openFile` defaulting to `main`.

Test it at https://simplemd.ishaan-xy.workers.dev/ — commit to a branch, then click the file again in the sidebar. You should see your committed version, not the `main` version.