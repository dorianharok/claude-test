# Architecture Overview - NestJS Backend Services

Complete guide to the layered architecture pattern and module system used in NestJS microservices.

## Table of Contents

- [NestJS Module System](#nestjs-module-system)
- [Layered Architecture Pattern](#layered-architecture-pattern)
- [Request Lifecycle](#request-lifecycle)
- [Module Organization](#module-organization)
- [Directory Structure Rationale](#directory-structure-rationale)
- [Separation of Concerns](#separation-of-concerns)

---

## NestJS Module System

### What are Modules?

**Modules** are the fundamental building blocks of NestJS applications. Every NestJS application has at least one module - the root module (AppModule).

```
┌─────────────────────────────────────┐
│         AppModule (Root)            │
│  ┌───────────────────────────────┐  │
│  │      UsersModule              │  │
│  │  - UsersController            │  │
│  │  - UsersService               │  │
│  │  - UsersRepository            │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │      AuthModule               │  │
│  │  - AuthController             │  │
│  │  - AuthService                │  │
│  │  - JwtStrategy                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │      PrismaModule             │  │
│  │  - PrismaService              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Module Anatomy

```typescript
@Module({
    imports: [ConfigModule, PrismaModule],      // Other modules this module depends on
    controllers: [UsersController],             // Controllers belong to this module
    providers: [UsersService, UsersRepository], // Services available in this module
    exports: [UsersService],                    // Make service available to other modules
})
export class UsersModule {}
```

**Key Principles:**
- **Encapsulation**: Each module encapsulates a feature
- **Dependency Injection**: Modules can import other modules
- **Exports**: Providers can be exported for use in other modules
- **Single Responsibility**: One module per feature domain

---

## Layered Architecture Pattern

### The Three Main Layers

```
┌─────────────────────────────────────┐
│         HTTP Request                │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  Layer 1: CONTROLLERS               │
│  - @Controller() decorator          │
│  - Route decorators (@Get, @Post)   │
│  - Request/response handling        │
│  - Input validation (DTOs)          │
│  - Call services                    │
│  - NO business logic                │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  Layer 2: SERVICES                  │
│  - @Injectable() decorator          │
│  - Business logic                   │
│  - Orchestration                    │
│  - Call repositories                │
│  - No HTTP knowledge                │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│  Layer 3: REPOSITORIES              │
│  - @Injectable() decorator          │
│  - Data access abstraction          │
│  - Prisma operations                │
│  - Query optimization               │
│  - Caching                          │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│         Database (Prisma)           │
└─────────────────────────────────────┘
```

### Why This Architecture?

**Testability:**
- Each layer can be tested independently
- Easy to mock dependencies with NestJS testing utilities
- Clear test boundaries

**Maintainability:**
- Changes isolated to specific layers
- Business logic separate from HTTP concerns
- Easy to locate bugs
- TypeScript compilation catches errors early

**Reusability:**
- Services can be used by controllers, CLI commands, cron jobs
- Repositories hide database implementation
- Business logic not tied to HTTP

**Scalability:**
- Easy to add new endpoints
- Clear patterns to follow
- Consistent structure
- Module system enables microservices architecture

---

## Request Lifecycle

### Complete Flow Example

```typescript
1. HTTP POST /api/users
   ↓
2. NestJS router matches @Post() decorator in UsersController
   ↓
3. Guards execute (if present):
   - @UseGuards(AuthGuard) - Authentication
   - Custom guards for authorization
   ↓
4. Interceptors (before):
   - Logging interceptor
   - Transform interceptor
   ↓
5. Pipes execute:
   - ValidationPipe validates DTO
   - Transform input data
   ↓
6. Controller method executes:
   @Post()
   create(@Body() createUserDto: CreateUserDto) {
       return this.usersService.create(createUserDto);
   }
   ↓
7. Service executes business logic:
   async create(dto: CreateUserDto): Promise<User> {
       // Check business rules
       // Call repository
       return await this.usersRepository.create(dto);
   }
   ↓
8. Repository performs database operation:
   async create(dto: CreateUserDto): Promise<User> {
       return this.prisma.user.create({ data: dto });
   }
   ↓
9. Response flows back:
   Repository → Service → Controller
   ↓
10. Interceptors (after):
    - Transform response
    - Add metadata
   ↓
11. Response sent to client
```

### Middleware/Guards/Interceptors Execution Order

```typescript
// main.ts - Global setup
app.useGlobalPipes(new ValidationPipe());          // 1. Global validation
app.useGlobalInterceptors(new SentryInterceptor());// 2. Global interceptors
app.useGlobalFilters(new AllExceptionsFilter());   // 3. Exception filters

// Module level - Execution order:
@Controller('users')
@UseInterceptors(LoggingInterceptor)  // 4. Controller-level interceptor (before)
@UseGuards(AuthGuard)                 // 5. Guards (auth/authz)
export class UsersController {
    @Post()
    @UseGuards(RolesGuard)            // 6. Route-level guards
    @UsePipes(ValidationPipe)         // 7. Route-level pipes
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }
}
// 8. Interceptor (after)
// 9. Exception filters (if error)
```

**Critical Order:**
1. Middleware (global)
2. Guards (authentication/authorization)
3. Interceptors (before)
4. Pipes (validation/transformation)
5. **Controller method executes**
6. Interceptors (after)
7. Exception filters (on error)

---

## Module Organization

### Feature-Based Modules (Recommended)

```
src/
├── users/                    # Users feature module
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── users.controller.spec.ts
│
├── auth/                     # Auth feature module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
│
├── common/                   # Shared code
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   ├── filters/
│   └── decorators/
│
├── prisma/                   # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── config/                   # Configuration
│   └── configuration.ts
│
├── app.module.ts             # Root module
└── main.ts                   # Bootstrap
```

**When to Create a Module:**
- Feature has 3+ related files
- Feature needs dependency injection
- Feature will be reused across the app
- Logical domain boundary exists

### Module Import Example

```typescript
// app.module.ts
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        PrismaModule,
        UsersModule,
        AuthModule,
    ],
})
export class AppModule {}

// users.module.ts
@Module({
    imports: [PrismaModule],           // Import modules you depend on
    controllers: [UsersController],    // Declare controllers
    providers: [
        UsersService,
        UsersRepository,
    ],
    exports: [UsersService],           // Export for use in other modules
})
export class UsersModule {}
```

---

## Directory Structure Rationale

### Controllers Directory

**Purpose:** Handle HTTP request/response concerns

**Location:** `src/users/users.controller.ts`

**Responsibilities:**
- Define routes with decorators (@Get, @Post, @Put, @Delete)
- Extract request parameters (@Param, @Body, @Query)
- Validation happens via DTOs
- Call appropriate service methods
- Return responses (NestJS handles serialization)
- Apply guards/interceptors via decorators

**Example:**
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}
```

### Services Directory

**Purpose:** Business logic and orchestration

**Location:** `src/users/users.service.ts`

**Responsibilities:**
- Implement business rules
- Orchestrate multiple repositories
- Transaction management
- Business validations
- No HTTP knowledge (no Request/Response types)

**Example:**
```typescript
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly configService: ConfigService,
    ) {}

    async create(dto: CreateUserDto): Promise<User> {
        // Business rule: check if email exists
        const exists = await this.usersRepository.findByEmail(dto.email);
        if (exists) {
            throw new ConflictException('Email already exists');
        }

        return this.usersRepository.create(dto);
    }
}
```

### Repositories Directory

**Purpose:** Data access abstraction

**Location:** `src/users/users.repository.ts`

**Responsibilities:**
- Prisma query operations
- Query optimization
- Database error handling
- Caching layer
- Hide Prisma implementation details

**Example:**
```typescript
@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });
    }

    async create(dto: CreateUserDto): Promise<User> {
        return this.prisma.user.create({
            data: dto,
        });
    }
}
```

### DTOs Directory

**Purpose:** Data Transfer Objects for validation

**Location:** `src/users/dto/create-user.dto.ts`

**Responsibilities:**
- Define input/output shapes
- Validation decorators (class-validator)
- Type safety
- API documentation (with @nestjs/swagger)

**Example:**
```typescript
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

---

## Separation of Concerns

### What Goes Where

**Controllers Layer:**
- ✅ Route definitions (decorators)
- ✅ Extract request data (@Param, @Body, @Query)
- ✅ Guards application (@UseGuards)
- ✅ Service calls
- ✅ Return responses
- ❌ Business logic
- ❌ Database operations
- ❌ Validation logic (use DTOs + pipes)

**Services Layer:**
- ✅ Business logic
- ✅ Business rules enforcement
- ✅ Orchestration (multiple repos)
- ✅ Transaction management
- ❌ HTTP concerns (Request/Response)
- ❌ Direct Prisma calls (use repositories)

**Repositories Layer:**
- ✅ Prisma operations
- ✅ Query construction
- ✅ Database error handling
- ✅ Caching
- ❌ Business logic
- ❌ HTTP concerns

### Example: User Creation

**Controller:**
```typescript
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @UsePipes(new ValidationPipe())
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}
```

**DTO:**
```typescript
export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    name: string;
}
```

**Service:**
```typescript
@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async create(dto: CreateUserDto): Promise<User> {
        // Business rule: check if email already exists
        const existing = await this.usersRepository.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        // Create user
        return await this.usersRepository.create(dto);
    }
}
```

**Repository:**
```typescript
@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateUserDto): Promise<User> {
        return this.prisma.user.create({ data: dto });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }
}
```

**Notice:** Each layer has clear, distinct responsibilities!

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Controllers details
- [services-and-repositories.md](services-and-repositories.md) - Service and repository patterns
