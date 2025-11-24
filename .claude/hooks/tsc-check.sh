#!/bin/bash

# TSC Hook with Visible Output for NestJS single project
# Uses stderr for visibility in Claude Code main interface

# Get project root directory (relative path from hooks directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOOK_INPUT=$(cat)
SESSION_ID="${session_id:-default}"
CACHE_DIR="$HOME/.claude/tsc-cache/$SESSION_ID"

# Create cache directory
mkdir -p "$CACHE_DIR"

# Extract tool name and input
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // ""')
TOOL_INPUT=$(echo "$HOOK_INPUT" | jq -r '.tool_input // {}')

# Function to detect the correct TSC command
get_tsc_command() {
    cd "$PROJECT_ROOT" 2>/dev/null || return 1

    if [ -f "tsconfig.build.json" ]; then
        echo "npx tsc --project tsconfig.build.json --noEmit"
    elif [ -f "tsconfig.json" ]; then
        echo "npx tsc --noEmit"
    else
        echo "npx tsc --noEmit"
    fi
}

# Function to run TSC check
run_tsc_check() {
    local cache_file="$CACHE_DIR/tsc-cmd.cache"

    cd "$PROJECT_ROOT" 2>/dev/null || return 1

    # Get or cache the TSC command
    local tsc_cmd
    if [ -f "$cache_file" ] && [ -z "$FORCE_DETECT" ]; then
        tsc_cmd=$(cat "$cache_file")
    else
        tsc_cmd=$(get_tsc_command)
        echo "$tsc_cmd" > "$cache_file"
    fi

    eval "$tsc_cmd" 2>&1
}

# Only process file modification tools
case "$TOOL_NAME" in
    Write|Edit|MultiEdit)
        # Extract file paths
        if [ "$TOOL_NAME" = "MultiEdit" ]; then
            FILE_PATHS=$(echo "$TOOL_INPUT" | jq -r '.edits[].file_path // empty')
        else
            FILE_PATHS=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')
        fi

        # Check if any TS/JS files were modified
        HAS_TS_FILES=$(echo "$FILE_PATHS" | grep -E '\.(ts|tsx|js|jsx)$')

        if [ -n "$HAS_TS_FILES" ]; then
            # Output to stderr for visibility
            echo "⚡ Running TypeScript check..." >&2

            # Run the check and capture output
            CHECK_OUTPUT=$(run_tsc_check 2>&1)
            CHECK_EXIT_CODE=$?

            # Check for TypeScript errors in output
            if [ $CHECK_EXIT_CODE -ne 0 ] || echo "$CHECK_OUTPUT" | grep -q "error TS"; then
                echo "❌ TypeScript errors found" >&2

                # Save error information
                echo "$CHECK_OUTPUT" > "$CACHE_DIR/last-errors.txt"

                # Save the TSC command used
                cat "$CACHE_DIR/tsc-cmd.cache" > "$CACHE_DIR/tsc-commands.txt"

                # Output to stderr for visibility
                {
                    echo ""
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo "🚨 TypeScript errors found"
                    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    echo ""
                    echo "👉 IMPORTANT: Please fix the TypeScript errors"
                    echo ""
                    echo "Error Preview:"
                    echo "$CHECK_OUTPUT" | grep "error TS" | head -10
                    echo ""
                    ERROR_COUNT=$(echo "$CHECK_OUTPUT" | grep -c "error TS")
                    if [ $ERROR_COUNT -gt 10 ]; then
                        echo "... and $(($ERROR_COUNT - 10)) more errors"
                    fi
                } >&2

                # Exit with code 1 to make stderr visible
                exit 1
            else
                echo "✅ TypeScript check passed" >&2
            fi
        fi
        ;;
esac

# Cleanup old cache directories (older than 7 days)
find "$HOME/.claude/tsc-cache" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

exit 0
