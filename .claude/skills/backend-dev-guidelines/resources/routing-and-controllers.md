# Controllers and Routing - NestJS Best Practices

Complete guide to creating controllers with decorators and handling HTTP requests in NestJS.

## Table of Contents

- [Controller Basics](#controller-basics)
- [Route Decorators](#route-decorators)
- [Parameter Decorators](#parameter-decorators)
- [DTOs and Validation](#dtos-and-validation)
- [Error Handling](#error-handling)
- [HTTP Status Codes](#http-status-codes)
- [Good Examples](#good-examples)
- [Anti-Patterns](#anti-patterns)

---

## Controller Basics

### Creating a Controller

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')  // Base route: /users
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
```

**Key Points:**
- Use `@Controller()` decorator to define base route
- Constructor injection for dependencies (services)
- Route decorators for HTTP methods
- NestJS handles response serialization automatically
- Return values are automatically converted to JSON

---

## Route Decorators

### Basic Route Decorators

```typescript
@Controller('users')
export class UsersController {
    // GET /users
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    // POST /users
    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    // GET /users/:id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    // PUT /users/:id
    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    // DELETE /users/:id
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    // PATCH /users/:id
    @Patch(':id')
    partialUpdate(@Param('id') id: string, @Body() dto: PartialUpdateUserDto) {
        return this.usersService.update(id, dto);
    }
}
```

### Nested Routes

```typescript
@Controller('users')
export class UsersController {
    // GET /users/:userId/posts
    @Get(':userId/posts')
    getUserPosts(@Param('userId') userId: string) {
        return this.postsService.findByUser(userId);
    }

    // POST /users/:userId/posts
    @Post(':userId/posts')
    createUserPost(
        @Param('userId') userId: string,
        @Body() createPostDto: CreatePostDto,
    ) {
        return this.postsService.create(userId, createPostDto);
    }
}
```

### Custom HTTP Status Codes

```typescript
import { HttpCode, HttpStatus } from '@nestjs/common';

@Controller('users')
export class UsersController {
    // Return 204 No Content on successful deletion
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    // Return 201 Created on successful creation
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }
}
```

---

## Parameter Decorators

### @Param() - Route Parameters

```typescript
@Controller('users')
export class UsersController {
    // Single parameter
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    // Multiple parameters
    @Get(':userId/posts/:postId')
    getUserPost(
        @Param('userId') userId: string,
        @Param('postId') postId: string,
    ) {
        return this.postsService.findOne(userId, postId);
    }

    // All parameters as object
    @Get(':userId/posts/:postId')
    getUserPost(@Param() params: { userId: string; postId: string }) {
        return this.postsService.findOne(params.userId, params.postId);
    }
}
```

### @Body() - Request Body

```typescript
@Controller('users')
export class UsersController {
    // Entire body with DTO
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    // Specific field from body
    @Post('login')
    login(@Body('email') email: string, @Body('password') password: string) {
        return this.authService.login(email, password);
    }
}
```

### @Query() - Query Parameters

```typescript
@Controller('users')
export class UsersController {
    // Single query parameter
    // GET /users?role=admin
    @Get()
    findAll(@Query('role') role?: string) {
        return this.usersService.findAll({ role });
    }

    // Multiple query parameters
    // GET /users?page=1&limit=10&sort=name
    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('sort') sort?: string,
    ) {
        return this.usersService.findAll({ page, limit, sort });
    }

    // All query parameters as object
    @Get()
    findAll(@Query() query: { page?: number; limit?: number; sort?: string }) {
        return this.usersService.findAll(query);
    }
}
```

### @Headers() - Request Headers

```typescript
@Controller('users')
export class UsersController {
    @Get(':id')
    findOne(@Param('id') id: string, @Headers('authorization') auth: string) {
        // Use auth header if needed
        return this.usersService.findOne(id);
    }
}
```

### @Req() and @Res() - Request/Response Objects

```typescript
import { Request, Response } from 'express';

@Controller('users')
export class UsersController {
    // ⚠️ Avoid using @Res() unless absolutely necessary
    // Using @Res() disables automatic response handling
    @Get(':id')
    findOne(@Param('id') id: string, @Res() res: Response) {
        const user = this.usersService.findOne(id);
        res.status(200).json(user);
    }

    // ✅ Prefer NestJS automatic response handling
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    // If you need request object
    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: Request) {
        console.log('User agent:', req.headers['user-agent']);
        return this.usersService.findOne(id);
    }
}
```

---

## DTOs and Validation

### Creating DTOs

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsNumber, Min } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsNumber()
    @Min(18)
    age: number;
}
```

### Using DTOs in Controllers

```typescript
@Controller('users')
export class UsersController {
    @Post()
    @UsePipes(new ValidationPipe())  // Apply validation
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}
```

### Global Validation Pipe

```typescript
// main.ts
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Apply validation globally
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,           // Strip properties not in DTO
        forbidNonWhitelisted: true, // Throw error if unknown properties
        transform: true,            // Auto-transform to DTO instance
    }));

    await app.listen(3000);
}
```

---

## Error Handling

### Built-in HTTP Exceptions

```typescript
import {
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const exists = await this.usersService.findByEmail(createUserDto.email);

        if (exists) {
            throw new ConflictException('Email already exists');
        }

        return this.usersService.create(createUserDto);
    }
}
```

### Custom Exception Filters

```typescript
// filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        // Capture to Sentry
        if (status >= 500) {
            Sentry.captureException(exception);
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: exception.message,
        });
    }
}
```

### Using Exception Filters

```typescript
// Apply to specific controller
@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UsersController {}

// Apply globally in main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

---

## HTTP Status Codes

### Standard Codes

| Code | NestJS Exception | Use Case |
|------|-----------------|----------|
| 200 | - | Success (default) |
| 201 | - | Created (use @HttpCode) |
| 204 | - | No Content |
| 400 | BadRequestException | Invalid input |
| 401 | UnauthorizedException | Not authenticated |
| 403 | ForbiddenException | No permission |
| 404 | NotFoundException | Resource not found |
| 409 | ConflictException | Duplicate resource |
| 422 | UnprocessableEntityException | Validation failed |
| 500 | InternalServerErrorException | Server error |

### Usage Examples

```typescript
import { HttpCode, HttpStatus } from '@nestjs/common';

@Controller('users')
export class UsersController {
    // 200 OK (default)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    // 201 Created
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    // 204 No Content
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    // Throw exceptions for errors
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}
```

---

## Good Examples

### Example 1: CRUD Controller (Excellent ✅)

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        if (!user) {
            throw new NotFoundException(`User ${id} not found`);
        }
        return user;
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
```

**What Makes This Excellent:**
- Clean decorator-based routing
- Proper dependency injection
- DTOs for validation
- Guards for authentication
- Proper HTTP status codes
- Error handling with exceptions

### Example 2: Controller with Query Parameters (Good ✅)

```typescript
@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: 'draft' | 'published',
    ) {
        return this.postsService.findAll({ page, limit, status });
    }

    @Get('search')
    search(@Query('q') query: string) {
        return this.postsService.search(query);
    }
}
```

---

## Anti-Patterns

### Anti-Pattern 1: Business Logic in Controllers (Bad ❌)

```typescript
// ❌ NEVER: Business logic in controller
@Controller('users')
export class UsersController {
    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        // ❌ Database access in controller
        const exists = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (exists) {
            throw new ConflictException('Email exists');
        }

        // ❌ Complex business logic in controller
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.prisma.user.create({
            data: { ...createUserDto, password: hashedPassword },
        });

        // ❌ More business logic
        await this.emailService.sendWelcomeEmail(user.email);

        return user;
    }
}
```

**Why This Is Bad:**
- Business logic in controller (hard to test)
- Direct database access (no abstraction)
- Cannot reuse logic
- Violates single responsibility

### How to Fix: Move to Service

```typescript
// ✅ GOOD: Clean controller
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}

// ✅ GOOD: Business logic in service
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly emailService: EmailService,
    ) {}

    async create(dto: CreateUserDto): Promise<User> {
        // Check if exists
        const exists = await this.usersRepository.findByEmail(dto.email);
        if (exists) {
            throw new ConflictException('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.usersRepository.create({
            ...dto,
            password: hashedPassword,
        });

        // Send welcome email
        await this.emailService.sendWelcomeEmail(user.email);

        return user;
    }
}
```

### Anti-Pattern 2: Not Using DTOs (Bad ❌)

```typescript
// ❌ NEVER: No type safety or validation
@Controller('users')
export class UsersController {
    @Post()
    create(@Body() body: any) {
        return this.usersService.create(body);
    }
}
```

**Fix: Use DTOs**

```typescript
// ✅ GOOD: Type-safe with validation
@Controller('users')
export class UsersController {
    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}
```

### Anti-Pattern 3: Manual Response Handling (Bad ❌)

```typescript
// ❌ AVOID: Manual response handling
@Controller('users')
export class UsersController {
    @Get(':id')
    async findOne(@Param('id') id: string, @Res() res: Response) {
        const user = await this.usersService.findOne(id);
        if (!user) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(200).json(user);
    }
}
```

**Fix: Use NestJS Built-in Response Handling**

```typescript
// ✅ GOOD: Let NestJS handle responses
@Controller('users')
export class UsersController {
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }
}
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main guide
- [services-and-repositories.md](services-and-repositories.md) - Service layer details
- [validation-patterns.md](validation-patterns.md) - DTO validation
- [complete-examples.md](complete-examples.md) - Full examples
