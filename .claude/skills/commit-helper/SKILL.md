---
name: commit-helper
description: Automates git commits and updates plan.md with git hashes after implementation. Use when user says "commit" to commit changes and track implementation progress. Handles TDD workflow completion and plan tracking.
---

# Commit Helper - Automated Commit & Plan Tracking

## Purpose

Automate the process of committing changes and updating plan.md with git commit hashes to track implementation progress. This skill integrates with the TDD workflow to provide a seamless "implement → commit → track" cycle.

## When to Use This Skill

This skill automatically activates when:
- User says "commit" to commit their changes
- After completing implementation work
- Following TDD cycles when tests are passing
- When ready to track progress in plan.md

---

## Workflow

When the user says "commit":

### 1. Pre-Commit Checks

- [ ] Verify all tests are passing
- [ ] Check for uncommitted changes
- [ ] Ensure no compiler/linter errors
- [ ] Verify plan.md exists and has structure

### 2. Git Status Analysis

```bash
# Check current status
git status

# Review changes to be committed
git diff --staged
git diff

# Check recent commits for message style
git log --oneline -5
```

### 3. Identify Work Completed

- Read plan.md to find recently marked items ([x])
- Review git diff to understand what was implemented
- Match changes to plan.md items
- Determine if this is structural or behavioral change

### 4. Create Commit

Follow the commit message format:
```
<type>: <summary>

<optional detailed description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature (behavioral change)
- `fix`: Bug fix (behavioral change)
- `refactor`: Code restructuring (structural change)
- `test`: Adding or modifying tests
- `docs`: Documentation changes
- `chore`: Build process, dependencies, etc.

**Examples:**
```bash
# Behavioral change
git commit -m "$(cat <<'EOF'
feat: add user authentication with JWT

Implemented login, register, and token refresh endpoints
following TDD principles.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Structural change
git commit -m "$(cat <<'EOF'
refactor: extract password hashing to separate service

Moved bcrypt logic from AuthService to PasswordService
for better separation of concerns.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 5. Update plan.md with Git Hash

After successful commit:

1. Get the commit hash: `git rev-parse --short HEAD`
2. Find the completed items in plan.md (marked with [x])
3. Add git hash next to completed items

**Format:**
```markdown
## Phase 1: Authentication
- [x] should hash password with bcrypt [abc123]
- [x] should validate JWT tokens [abc123]
- [ ] should refresh tokens
```

**Multiple commits per item:**
```markdown
- [x] should implement user authentication [abc123, def456]
```

### 6. Commit plan.md Update

```bash
git add plan.md
git commit -m "$(cat <<'EOF'
docs: update plan.md with commit hash

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Best Practices

### Commit Discipline

✅ **DO:**
- Commit when all tests pass
- Write clear, descriptive commit messages
- Separate structural and behavioral changes
- Update plan.md with commit hashes
- Follow the commit message template
- Review git diff before committing

❌ **DON'T:**
- Commit with failing tests
- Mix structural and behavioral changes
- Skip commit message details
- Forget to update plan.md
- Commit without reviewing changes

### Plan.md Integration

**Single commit per item:**
```markdown
- [x] should create user with valid data [a1b2c3d]
```

**Multiple commits (iterative work):**
```markdown
- [x] should handle file uploads [a1b2c3d, e4f5g6h, i7j8k9l]
```

**Work in progress (partial completion):**
```markdown
- [~] should implement complex workflow [a1b2c3d] (WIP: basic structure)
```

### Commit Message Quality

**Good:**
```
feat: add post creation with file attachments

Implemented PostsService.create() with file upload support.
Files are validated and stored with metadata in database.
All tests passing.
```

**Bad:**
```
update code
```

---

## Example Session

```
User: commit