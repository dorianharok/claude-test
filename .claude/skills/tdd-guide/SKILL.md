---
name: tdd-guide
description: Senior software engineer following Kent Beck's Test-Driven Development (TDD) and Tidy First principles. Use when writing tests, implementing features using TDD methodology, or refactoring code. Enforces Red-Green-Refactor cycle, minimal implementation, and separation of structural vs behavioral changes.
---

# TDD Guide - Test-Driven Development & Tidy First

## Purpose

Guide development following Kent Beck's Test-Driven Development (TDD) and Tidy First principles with strict adherence to the Red-Green-Refactor cycle.

## When to Use This Skill

This skill automatically activates when:
- Writing or modifying tests
- Implementing new features
- Refactoring existing code
- Working on test files (*.spec.ts, *.test.ts)
- User says "go" to proceed with TDD workflow
- User mentions TDD, tests, or refactoring

---

## Core Development Principles

### TDD Cycle: Red → Green → Refactor

1. **Red**: Write a simple failing test first
2. **Green**: Implement the minimum code needed to make tests pass
3. **Refactor**: Improve structure only after tests are passing

### Key Rules

- Write the simplest failing test first
- Implement the minimum code needed to make tests pass - no more
- Refactor only after tests are passing
- Follow Beck's "Tidy First" approach by separating structural changes from behavioral changes
- Maintain high code quality throughout development

---

## TDD Methodology Guidance

### Writing Tests

- Start by writing a failing test that defines a small increment of functionality
- Use meaningful test names that describe behavior (e.g., "shouldSumTwoPositiveNumbers")
- Make test failures clear and informative
- Write just enough code to make the test pass - no more
- Once tests pass, consider if refactoring is needed
- Repeat the cycle for new functionality

### Fixing Defects

When fixing a defect:
1. First write an API-level failing test
2. Then write the smallest possible test that replicates the problem
3. Get both tests to pass

---

## Tidy First Approach

### Separate All Changes Into Two Types

1. **STRUCTURAL CHANGES**: Rearranging code without changing behavior
   - Renaming variables/functions
   - Extracting methods
   - Moving code
   - Organizing imports

2. **BEHAVIORAL CHANGES**: Adding or modifying actual functionality
   - New features
   - Bug fixes
   - Logic changes

### Rules

- **NEVER** mix structural and behavioral changes in the same commit
- **ALWAYS** make structural changes first when both are needed
- Validate structural changes do not alter behavior by running tests before and after

---

## Commit Discipline

### Only commit when:

1. **ALL** tests are passing
2. **ALL** compiler/linter warnings have been resolved
3. The change represents a single logical unit of work
4. Commit messages clearly state whether the commit contains structural or behavioral changes

### Best Practices

- Use small, frequent commits rather than large, infrequent ones
- Structural commits: "refactor: extract calculateTotal method"
- Behavioral commits: "feat: add tax calculation to checkout"

---

## Code Quality Standards

- Eliminate duplication ruthlessly
- Express intent clearly through naming and structure
- Make dependencies explicit
- Keep methods small and focused on a single responsibility
- Minimize state and side effects
- Use the simplest solution that could possibly work

---

## Refactoring Guidelines

- Refactor **only** when tests are passing (in the "Green" phase)
- Use established refactoring patterns with their proper names
- Make one refactoring change at a time
- Run tests after each refactoring step
- Prioritize refactorings that remove duplication or improve clarity

---

## Example Workflow

When the user says "go":

1. **Check plan.md** - Find the next SINGLE unmarked test in plan.md
2. **Write Test** - Write a simple failing test for that item
3. **Run Test** - Verify test fails (Red)
4. **Implement** - Write minimum code to make it pass
5. **Run Tests** - Verify test passes (Green)
6. **Refactor** - Make structural changes if needed, running tests after each change
7. **Commit** - Commit with clear message (structural or behavioral)
8. **Mark Complete** - Mark the test as done in plan.md
9. **Repeat** - Continue with next test

### Example Session

```
User: go
Assistant: Checking plan.md for the next unmarked test...

Found: "should calculate tax on checkout total"

Writing failing test:
  describe('Checkout', () => {
    it('should calculate tax on checkout total', () => {
      const checkout = new Checkout();
      expect(checkout.calculateTax(100)).toBe(10);
    });
  });

Running tests... ❌ FAILED (as expected - Red phase)

Implementing minimum code:
  class Checkout {
    calculateTax(amount: number): number {
      return amount * 0.1;
    }
  }

Running tests... ✅ PASSED (Green phase)

Checking for refactoring opportunities... None needed yet.

Marking test as complete in plan.md
Ready for next test.
```

---

## Integration with plan.md

This skill looks for and follows instructions in `plan.md` at the project root:

- The file should contain a list of tests to implement
- Mark completed tests with [x] or similar marker
- When user says "go", find the next unmarked test
- Implement using TDD cycle
- Mark as complete when done

Example plan.md:
```markdown
# Development Plan

## Authentication Tests
- [x] should validate email format
- [x] should reject weak passwords
- [ ] should hash passwords before storing
- [ ] should generate JWT tokens on login
- [ ] should validate JWT tokens

## User Management Tests
- [ ] should create new user
- [ ] should update user profile
```

---

## Testing Guidelines

### Test Structure

```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should describe expected behavior', () => {
    // Arrange
    const input = setupTestData();

    // Act
    const result = performAction(input);

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Test Naming

✅ Good:
- `should calculate total with tax`
- `should throw error when email is invalid`
- `should return empty array when no users found`

❌ Bad:
- `test1`
- `works`
- `check calculation`

---

## Running Tests

Always run all tests (except long-running tests) each time:

```bash
# Run all tests
npm test

# Run specific test file
npm test user.service.spec.ts

# Run with coverage
npm test -- --coverage
```

---

## Common Patterns

### Triangulation

When unsure of the implementation:
1. Write test for simple case: `add(1, 1) → 2`
2. Write test for another case: `add(2, 3) → 5`
3. Implement general solution

### Fake It Till You Make It

Start with hardcoded values, then generalize:
1. Test: `getFoo() → 'foo'`
2. Implement: `return 'foo'`
3. Test: `getBar() → 'bar'`
4. Refactor to: `return this.value`

### Obvious Implementation

If the implementation is obvious, just write it:
1. Test: `sum([1, 2, 3]) → 6`
2. Implement: `return arr.reduce((a, b) => a + b, 0)`

---

## Anti-Patterns to Avoid

❌ Writing multiple tests before implementation
❌ Writing implementation before tests
❌ Skipping the refactor step
❌ Mixing structural and behavioral changes
❌ Committing with failing tests
❌ Over-engineering solutions
❌ Not running tests frequently enough
❌ Writing tests after implementation

---

## Checklist Before Commit

- [ ] All tests passing
- [ ] No compiler errors
- [ ] No linter warnings
- [ ] Code follows quality standards
- [ ] Commit message is clear (structural vs behavioral)
- [ ] Changes are minimal and focused

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Follows TDD principles**: ✅
