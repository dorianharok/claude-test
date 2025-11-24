---
name: backend-dev-guidelines
description: Comprehensive backend development guide for NestJS/TypeScript microservices. Use when creating controllers, services, repositories, guards, interceptors, or working with NestJS modules, Prisma database access, Sentry error tracking, class-validator validation, ConfigModule, dependency injection, or async patterns. Covers layered architecture (controllers → services → repositories), decorator-based routing, error handling, performance monitoring, testing strategies, and NestJS best practices.
---

# Backend Development Guidelines

## Purpose

Establish consistency and best practices across backend microservices using modern NestJS/TypeScript patterns.

## When to Use This Skill

Automatically activates when working on:
- Creating or modifying controllers, endpoints, APIs
- Building modules, services, repositories
- Implementing guards, interceptors, pipes (auth, validation, error handling)
- Database operations with Prisma
- Error tracking with Sentry
- Input validation with class-validator
- Configuration management with ConfigModule
- Backend testing and refactoring

---

## Quick Start

### New Backend Feature Checklist

- [ ] **Module**: Feature module with @Module() decorator
- [ ] **Controller**: Decorated with @Controller(), use decorators for routes
- [ ] **Service**: Business logic with @Injectable() and DI
- [ ] **Repository**: Database access with @Injectable()
- [ ] **DTOs**: class-validator for input validation
- [ ] **Sentry**: Error tracking with exception filters
- [ ] **Tests**: Unit + e2e tests with NestJS testing utilities
- [ ] **Config**: Use ConfigModule and ConfigService

### New Microservice Checklist

- [ ] Directory structure (see [architecture-overview.md](architecture-overview.md))
- [ ] main.ts with NestJS bootstrap
- [ ] AppModule with imports/providers/controllers
- [ ] Sentry integration with @sentry/nestjs
- [ ] ConfigModule setup
- [ ] Global validation pipe
- [ ] Exception filters
- [ ] Testing framework (Jest + @nestjs/testing)

---

## Architecture Overview

### Layered Architecture

```
HTTP Request
    ↓
Controllers (request handling with decorators)
    ↓
Services (business logic)
    ↓
Repositories (data access)
    ↓
Database (Prisma)
```

**Key Principle:** Each layer has ONE responsibility. NestJS modules organize features.

See [architecture-overview.md](architecture-overview.md) for complete details.

---

## Directory Structure

```
service/src/
├── modules/             # Feature modules
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
├── common/              # Shared code
│   ├── guards/          # Auth guards
│   ├── interceptors/    # Interceptors
│   ├── pipes/           # Validation pipes
│   ├── filters/         # Exception filters
│   ├── decorators/      # Custom decorators
│   └── interfaces/      # Shared interfaces
├── config/              # Configuration
│   └── configuration.ts
├── prisma/              # Prisma module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts        # Root module
└── main.ts              # Bootstrap

```

**Naming Conventions:**
- Modules: `feature.module.ts` - `users.module.ts`
- Controllers: `feature.controller.ts` - `users.controller.ts`
- Services: `feature.service.ts` - `users.service.ts`
- Repositories: `feature.repository.ts` - `users.repository.ts`
- DTOs: `action-entity.dto.ts` - `create-user.dto.ts`

---

## Core Principles (8 Key Rules)

### 1. Use Decorators for Routing

```typescript
// ❌ NEVER: Manual route registration
router.post('/users', handler);

// ✅ ALWAYS: Use decorators
@Controller('users')
export class UsersController {
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}
```

### 2. Controllers Handle HTTP, Services Handle Business Logic

```typescript
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
}
```

### 3. Use Dependency Injection

```typescript
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly configService: ConfigService,
    ) {}
}
```

### 4. All Errors to Sentry via Exception Filters

```typescript
@Catch()
export class SentryFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        Sentry.captureException(exception);
        // Handle response
    }
}
```

### 5. Use ConfigService, NEVER process.env Directly

```typescript
// ❌ NEVER
const timeout = process.env.TIMEOUT_MS;

// ✅ ALWAYS
constructor(private configService: ConfigService) {}
const timeout = this.configService.get<number>('TIMEOUT_MS');
```

### 6. Validate All Input with class-validator

```typescript
export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    name: string;
}
```

### 7. Use Repository Pattern for Data Access

```typescript
@Injectable()
export class UsersRepository {
    constructor(private prisma: PrismaService) {}

    findActive() {
        return this.prisma.user.findMany({ where: { isActive: true } });
    }
}
```

### 8. Comprehensive Testing with NestJS Testing Utilities

```typescript
describe('UsersService', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [UsersService],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should create user', async () => {
        expect(await service.create(dto)).toBeDefined();
    });
});
```

---

## Common Imports

```typescript
// NestJS Core
import { Module, Controller, Injectable, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';

// Validation
import { IsString, IsEmail, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

// Database
import { PrismaService } from './prisma/prisma.service';
import type { Prisma } from '@prisma/client';

// Configuration
import { ConfigService, ConfigModule } from '@nestjs/config';

// Exception Handling
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';

// Testing
import { Test, TestingModule } from '@nestjs/testing';

// Guards & Interceptors
import { AuthGuard } from '@nestjs/passport';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
```

---

## Quick Reference

### HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

### NestJS Best Practices

**Module Organization** - Feature-based modules with clear boundaries
**Dependency Injection** - Constructor injection for all dependencies
**Validation** - Global validation pipe with class-validator DTOs
**Exception Filters** - Centralized error handling with Sentry integration

---

## Anti-Patterns to Avoid

❌ Business logic in controllers (use services)
❌ Direct process.env usage (use ConfigService)
❌ Missing exception filters
❌ No input validation (use ValidationPipe + DTOs)
❌ Direct Prisma in services (use repositories)
❌ console.log instead of proper logging (use Logger + Sentry)
❌ Not using dependency injection
❌ Missing @Injectable() decorators

---

## Navigation Guide

| Need to... | Read this |
|------------|-----------|
| Understand NestJS architecture | [architecture-overview.md](architecture-overview.md) |
| Create controllers with decorators | [routing-and-controllers.md](routing-and-controllers.md) |
| Organize business logic in services | [services-and-repositories.md](services-and-repositories.md) |
| Validate input with DTOs | [validation-patterns.md](validation-patterns.md) |
| Add error tracking with filters | [sentry-and-monitoring.md](sentry-and-monitoring.md) |
| Create guards/interceptors/pipes | [middleware-guide.md](middleware-guide.md) |
| Database access with Prisma | [database-patterns.md](database-patterns.md) |
| Manage config with ConfigModule | [configuration.md](configuration.md) |
| Handle async/errors in NestJS | [async-and-errors.md](async-and-errors.md) |
| Write tests with @nestjs/testing | [testing-guide.md](testing-guide.md) |
| See complete NestJS examples | [complete-examples.md](complete-examples.md) |

---

## Resource Files

### [architecture-overview.md](architecture-overview.md)
NestJS modules, layered architecture, request lifecycle, separation of concerns

### [routing-and-controllers.md](routing-and-controllers.md)
Controller decorators (@Get, @Post, etc.), DTOs, error handling, examples

### [services-and-repositories.md](services-and-repositories.md)
@Injectable services, dependency injection, repository pattern, caching

### [validation-patterns.md](validation-patterns.md)
class-validator decorators, DTOs, validation pipes

### [sentry-and-monitoring.md](sentry-and-monitoring.md)
Sentry integration with @sentry/nestjs, exception filters, performance monitoring

### [middleware-guide.md](middleware-guide.md)
Guards (@UseGuards), Interceptors (@UseInterceptors), Pipes, custom decorators

### [database-patterns.md](database-patterns.md)
PrismaService module, repositories with @Injectable, transactions, optimization

### [configuration.md](configuration.md)
ConfigModule, ConfigService, environment validation

### [async-and-errors.md](async-and-errors.md)
Async patterns, custom exceptions, exception filters

### [testing-guide.md](testing-guide.md)
Unit/e2e tests with @nestjs/testing, mocking, coverage

### [complete-examples.md](complete-examples.md)
Full NestJS feature examples, refactoring guide

---

## Related Skills

- **database-verification** - Verify column names and schema consistency
- **error-tracking** - Sentry integration patterns
- **skill-developer** - Meta-skill for creating and managing skills

---

**Skill Status**: COMPLETE ✅
**Line Count**: < 500 ✅
**Progressive Disclosure**: 11 resource files ✅
