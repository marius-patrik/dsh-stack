#!/bin/sh
# Install git hooks for the agents superproject.
# Run once: .agents/hooks/install.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.agents/hooks"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "ERROR: Not a git repository (no .git/hooks/)."
  exit 1
fi

for hook in pre-commit commit-msg pre-push; do
  src="$HOOKS_DIR/$hook"
  dst="$GIT_HOOKS_DIR/$hook"
  if [ ! -f "$src" ]; then
    echo "SKIP: $hook not found in $HOOKS_DIR"
    continue
  fi
  chmod +x "$src"
  if [ -f "$dst" ] && [ ! -L "$dst" ]; then
    echo "BACKUP: $dst → ${dst}.bak"
    mv "$dst" "${dst}.bak"
  fi
  ln -sf "$src" "$dst"
  echo "INSTALLED: $hook"
done

echo ""
echo "Hooks installed. Commit messages must match: <verb>: <subject>"
echo "Allowed verbs: fix, feat, docs, build, refactor, test, chore, pin, ship"
