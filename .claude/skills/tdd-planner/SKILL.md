---
name: tdd-planner
description: Creates detailed TDD implementation plans broken down into small, testable units. Use when planning features, creating development roadmaps, or breaking down requirements into TDD-friendly test lists. Generates plan.md files that integrate with tdd-guide skill for Red-Green-Refactor workflow.
---

# TDD Planner - Test-Driven Development Planning

## Purpose

Creates comprehensive implementation plans broken down into very small, testable units following TDD principles. Generates `plan.md` files that the `tdd-guide` skill uses to drive Red-Green-Refactor development cycles.

## When to Use This Skill

Use this skill when:
- Starting a new feature or project
- User requests a development plan, implementation plan, or roadmap
- Breaking down complex requirements into testable units
- Planning TDD workflow
- User mentions: "계획", "plan", "플랜", "수립", "설계", "roadmap", "break down"
- Before running TDD cycles with `tdd-guide` skill

## Core Philosophy

### Small, Incremental Tests

Each test should:
- Test ONE specific behavior
- Be implementable in 5-15 minutes
- Follow the single responsibility principle
- Build on previous tests incrementally
- Be independently verifiable

### Natural Development Order

Order tests by:
1. **Foundation First**: Core data structures, basic operations
2. **Simple to Complex**: Easy cases before edge cases
3. **Dependencies**: Prerequisites before dependent features
4. **Value First**: High-value features before nice-to-haves
5. **Risk-Driven**: High-risk areas early for validation

---

## How It Works

### Step 1: Analyze Requirements

When user provides requirements:
1. **Clarify Scope**: Ask questions to understand the full context
2. **Identify Core Features**: Extract main functionality
3. **Find Dependencies**: Determine prerequisite components
4. **Spot Edge Cases**: Identify boundary conditions and special cases
5. **Consider Architecture**: Think about structure needed

### Step 2: Break Down Into Tests

For each feature:
1. **Start with Happy Path**: Most basic successful scenario
2. **Add Variations**: Different valid inputs and scenarios
3. **Handle Edge Cases**: Boundaries, limits, special conditions
4. **Error Scenarios**: Invalid inputs, error conditions
5. **Integration Points**: How it connects to other parts

### Step 3: Order Tests Logically

Arrange tests so:
- Each test builds on previous work
- Dependencies come before dependents
- Simple cases before complex
- Core functionality before enhancements
- Fast feedback on risky areas

### Step 4: Generate plan.md

Create structured plan.md file with:
- Clear section headers (by feature/module)
- Checkbox format for tracking (- [ ] or - [x])
- Descriptive test names ("should..." format)
- Logical grouping and ordering
- Comments for context where needed

---

## Plan.md Structure

### Format

```markdown
# Development Plan

## Feature Name / Module Name

### Core Functionality
- [ ] should handle the simplest valid case
- [ ] should handle another common case
- [ ] should handle edge case X

### Error Handling
- [ ] should throw error when input is invalid
- [ ] should handle missing data gracefully

### Integration
- [ ] should integrate with component A
- [ ] should work with existing feature B

## Next Feature

### Setup
- [ ] should initialize required components
...
```

### Checkbox Conventions

- `- [ ]` - Not started (pending)
- `- [x]` - Completed
- Use consistent format for tdd-guide compatibility

### Test Naming

Use "should..." format for clarity:
- ✅ `should calculate total with tax`
- ✅ `should throw error when email is invalid`
- ✅ `should return empty array when no results found`
- ❌ `test calculation`
- ❌ `email validation`
- ❌ `checks for empty`

---

## Breaking Down Requirements

### Example: User Authentication

**High-Level Requirement**: "Implement user authentication"

**Broken Down**:

```markdown
## User Authentication

### Password Validation
- [ ] should accept valid password (8+ chars, mixed case, number)
- [ ] should reject password shorter than 8 characters
- [ ] should reject password without uppercase letter
- [ ] should reject password without lowercase letter
- [ ] should reject password without number

### Email Validation
- [ ] should accept valid email format
- [ ] should reject invalid email format
- [ ] should normalize email to lowercase

### User Registration
- [ ] should create user with valid email and password
- [ ] should hash password before storing
- [ ] should reject duplicate email
- [ ] should generate unique user ID

### User Login
- [ ] should authenticate with correct credentials
- [ ] should reject incorrect password
- [ ] should reject non-existent email
- [ ] should generate JWT token on successful login

### Token Validation
- [ ] should validate valid JWT token
- [ ] should reject expired token
- [ ] should reject malformed token
- [ ] should extract user info from valid token
```

### Example: E-commerce Cart

**High-Level Requirement**: "Shopping cart functionality"

**Broken Down**:

```markdown
## Shopping Cart

### Cart Initialization
- [ ] should create empty cart for new user
- [ ] should restore cart from session

### Adding Items
- [ ] should add single item to empty cart
- [ ] should increase quantity when adding duplicate item
- [ ] should handle adding multiple different items
- [ ] should reject adding item with invalid ID
- [ ] should reject negative quantities

### Removing Items
- [ ] should remove item from cart
- [ ] should decrease quantity when removing one unit
- [ ] should handle removing non-existent item

### Cart Calculations
- [ ] should calculate subtotal for single item
- [ ] should calculate subtotal for multiple items
- [ ] should apply percentage discount
- [ ] should calculate tax on subtotal
- [ ] should calculate final total with tax and discount

### Cart Persistence
- [ ] should save cart to session
- [ ] should load cart from session
- [ ] should clear cart after checkout
```

---

## Best Practices

### Test Granularity

**Too Large** (violates single responsibility):
```markdown
- [ ] should handle user registration with validation and email confirmation
```

**Just Right** (small, focused):
```markdown
- [ ] should create user with valid data
- [ ] should validate email format
- [ ] should send confirmation email
- [ ] should activate account on email confirmation
```

### Avoid Over-Planning

- Don't plan every possible test upfront
- Start with core functionality
- Add tests as you discover edge cases
- Keep plan flexible and adaptive

### Balance Detail and Flexibility

- Enough detail to guide implementation
- Not so detailed it becomes rigid
- Leave room for discoveries during development
- Update plan as you learn

### Use Comments for Context

```markdown
## Payment Processing

# Note: Using Stripe API - requires test mode keys
- [ ] should initialize Stripe client with API key
- [ ] should create payment intent for order

# Edge case: handle network failures
- [ ] should retry on network timeout
- [ ] should handle Stripe API errors gracefully
```

---

## Integration with tdd-guide

Once plan.md is created:

1. **tdd-guide Takes Over**: When user says "go", tdd-guide skill activates
2. **Reads plan.md**: Finds next uncompleted test
3. **Red Phase**: Writes failing test
4. **Green Phase**: Implements minimum code to pass
5. **Refactor Phase**: Improves code structure
6. **Marks Complete**: Updates checkbox in plan.md
7. **Repeats**: Continues to next test

### Workflow Example

```
User: "I need to implement user authentication"
↓
tdd-planner: Creates plan.md with detailed test breakdown
↓
User: "go"
↓
tdd-guide: Reads plan.md, implements first test using TDD cycle
↓
User: "go" (repeats)
↓
tdd-guide: Continues through plan.md until all tests complete
```

---

## Creating the Plan

### Ask Clarifying Questions

Before creating plan, consider asking:
- "What are the core features needed?"
- "Are there any constraints or requirements I should know?"
- "Which features are highest priority?"
- "What's the expected user flow?"
- "Are there any edge cases you're concerned about?"

### Present the Plan

1. Show the complete plan.md content
2. Explain the grouping and ordering logic
3. Highlight any assumptions made
4. Ask for feedback before finalizing
5. Create the file after approval

### Update the Plan

Plans are living documents:
- User can request additions/changes
- Discoveries during development may require updates
- Reorder tests if dependencies change
- Remove tests that become irrelevant

---

## Anti-Patterns to Avoid

❌ **Too Vague**
```markdown
- [ ] test authentication
- [ ] test cart
```

✅ **Specific and Actionable**
```markdown
- [ ] should authenticate user with valid credentials
- [ ] should add item to empty cart
```

---

❌ **Too Granular**
```markdown
- [ ] should create variable x
- [ ] should set property y
- [ ] should return object z
```

✅ **Behavior-Focused**
```markdown
- [ ] should calculate total price including tax
```

---

❌ **Wrong Order**
```markdown
- [ ] should validate JWT token (needs token generation first!)
- [ ] should generate JWT token on login
```

✅ **Dependency-Aware**
```markdown
- [ ] should generate JWT token on login
- [ ] should validate JWT token
```

---

## Tips for Effective Planning

### Think in User Stories

Convert features to user perspective:
- "As a user, I want to reset my password"
- Break down into: validation, email sending, token generation, password update

### Use Examples

Include concrete examples in comments:
```markdown
# Example: calculateTax(100, 0.1) → 10
- [ ] should calculate tax as percentage of amount
```

### Consider Test Data

Think about what data you'll need:
```markdown
## User CRUD Operations

# Test data: valid user object, invalid emails, etc.
- [ ] should create user with all required fields
- [ ] should reject user missing required field
```

### Plan for Refactoring

Some tests naturally lead to refactoring:
```markdown
## Calculator

- [ ] should add two numbers
- [ ] should subtract two numbers
- [ ] should multiply two numbers
# After these pass, refactor to use operation strategy pattern
```

---

## Example Session

```
User: "계획을 수립해줘. 간단한 할일 관리 API를 만들고 싶어"