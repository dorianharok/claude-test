# Guards, Interceptors, and Pipes - NestJS Middleware

Complete guide to NestJS request processing pipeline: Guards for authentication/authorization, Interceptors for cross-cutting concerns, and Pipes for transformation/validation.

## Table of Contents

- [Overview](#overview)
- [Guards (Authentication & Authorization)](#guards-authentication--authorization)
- [Interceptors (Cross-Cutting Concerns)](#interceptors-cross-cutting-concerns)
- [Pipes (Transformation & Validation)](#pipes-transformation--validation)
- [Custom Decorators](#custom-decorators)
- [Execution Order](#execution-order)

---

## Overview

### NestJS Request Pipeline

```
Incoming Request
    ↓
Middleware (global)
    ↓
Guards (authentication/authorization)
    ↓
Interceptors (before)
    ↓
Pipes (validation/transformation)
    ↓
Route Handler
    ↓
Interceptors (after)
    ↓
Exception Filters (if error)
    ↓
Response
```

### When to Use What

| Component | Purpose | Examples |
|-----------|---------|----------|
| **Guards** | Authentication, Authorization | JWT auth, role-based access |
| **Interceptors** | Transform request/response, logging, caching | Response formatting, logging |
| **Pipes** | Validation, transformation | DTO validation, type conversion |

---

## Guards (Authentication & Authorization)

### JWT Auth Guard

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check if route is public
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired token');
        }
        return user;
    }
}
```

### Role-Based Guard

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.roles) {
            throw new ForbiddenException('Insufficient permissions');
        }

        const hasRole = requiredRoles.some(role => user.roles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
```

### Using Guards

```typescript
// Global
app.useGlobalGuards(new JwtAuthGuard(reflector));

// Controller level
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {}

// Route level
@Get('admin')
@UseGuards(RolesGuard)
@Roles('admin')
getAdminData() {}
```

---

## Interceptors (Cross-Cutting Concerns)

### Logging Interceptor

```typescript
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const delay = Date.now() - now;
                this.logger.log(
                    `${method} ${url} ${response.statusCode} - ${delay}ms`,
                );
            }),
        );
    }
}
```

### Response Transform Interceptor

```typescript
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    success: boolean;
    data: T;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(
            map(data => ({
                success: true,
                data,
                timestamp: new Date().toISOString(),
            })),
        );
    }
}
```

### Sentry Interceptor

```typescript
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        return next.handle().pipe(
            tap(() => {
                // Success - could log metrics here
            }),
            catchError(err => {
                Sentry.withScope(scope => {
                    scope.setContext('http', {
                        method: request.method,
                        url: request.url,
                        headers: request.headers,
                    });

                    if (request.user) {
                        scope.setUser({
                            id: request.user.id,
                            email: request.user.email,
                        });
                    }

                    Sentry.captureException(err);
                });

                return throwError(() => err);
            }),
        );
    }
}
```

---

## Pipes (Transformation & Validation)

### Built-in Pipes

```typescript
import {
    ParseIntPipe,
    ParseBoolPipe,
    ParseUUIDPipe,
    DefaultValuePipe,
} from '@nestjs/common';

@Controller('users')
export class UsersController {
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Get()
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('active', ParseBoolPipe) active: boolean,
    ) {
        return this.usersService.findAll(page, active);
    }
}
```

### Custom Transformation Pipe

```typescript
import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (typeof value === 'string') {
            return value.trim();
        }
        if (typeof value === 'object' && value !== null) {
            return this.trimObject(value);
        }
        return value;
    }

    private trimObject(obj: any): any {
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                obj[key] = this.trimObject(obj[key]);
            }
        });
        return obj;
    }
}
```

---

## Custom Decorators

### User Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        return data ? user?.[data] : user;
    },
);

// Usage
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@User() user: UserEntity) {
    return user;
}

@Get('email')
getEmail(@User('email') email: string) {
    return { email };
}
```

### Roles Decorator

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
getAdminData() {}
```

### Public Decorator

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Usage
@Get('public')
@Public()
getPublicData() {
    return { message: 'This is public' };
}
```

---

## Execution Order

### Complete Flow

```typescript
// main.ts
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // 1. Global pipes
    app.useGlobalPipes(new ValidationPipe());

    // 2. Global guards
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    // 3. Global interceptors
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TransformInterceptor(),
        new SentryInterceptor(),
    );

    // 4. Global filters
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.listen(3000);
}

// Controller
@Controller('users')
@UseInterceptors(ControllerInterceptor)
@UseGuards(RolesGuard)
export class UsersController {
    @Post()
    @UseGuards(PermissionsGuard)
    @UseInterceptors(RouteInterceptor)
    @UsePipes(CustomPipe)
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }
}
```

**Execution Order:**
1. Global pipes
2. Global guards
3. Controller guards
4. Route guards
5. Global interceptors (before)
6. Controller interceptors (before)
7. Route interceptors (before)
8. Route pipes
9. **Route handler executes**
10. Route interceptors (after)
11. Controller interceptors (after)
12. Global interceptors (after)
13. Exception filters (if error)

---

**Related Files:**
- [SKILL.md](../SKILL.md)
- [routing-and-controllers.md](routing-and-controllers.md)
- [validation-patterns.md](validation-patterns.md)
