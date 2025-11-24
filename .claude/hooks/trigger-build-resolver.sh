#!/bin/bash

# Simple build check trigger for NestJS project
# Logs activity but doesn't auto-trigger build resolver

HOOK_INPUT=$(cat)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Check if there are any git changes
cd "$PROJECT_ROOT"
git_status=$(git status --porcelain 2>/dev/null)

if [ -n "$git_status" ]; then
    echo "Changes detected in project" >> /tmp/claude-hook-debug.log
    echo "Run 'npm run build' or 'npm test' to verify changes" >&2
fi

exit 0
