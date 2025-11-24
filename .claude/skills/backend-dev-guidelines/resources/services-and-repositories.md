# Services and Repositories - NestJS Business Logic Layer

Complete guide to organizing business logic with services and data access with repositories in NestJS.

## Table of Contents

- [Service Layer with @Injectable](#service-layer-with-injectable)
- [Dependency Injection in NestJS](#dependency-injection-in-nestjs)
- [Repository Pattern](#repository-pattern)
- [Service Design Principles](#service-design-principles)
- [Provider Scopes](#provider-scopes)
- [Testing Services](#testing-services)

---

## Service Layer with @Injectable

### Purpose of Services

**Services contain business logic** - the 'what' and 'why' of your application:

```
Controller asks: "Should I do this?"
Service answers: "Yes/No, here's why, and here's what happens"
Repository executes: "Here's the data you requested"
```

**Services are responsible for:**
- ✅ Business rules enforcement
- ✅ Orchestrating multiple repositories
- ✅ Transaction management
- ✅ Complex calculations
- ✅ External service integration
- ✅ Business validations

**Services should NOT:**
- ❌ Know about HTTP (no Request/Response types)
- ❌ Direct Prisma access (use repositories)
- ❌ Handle route-specific logic
- ❌ Format HTTP responses

---

## Dependency Injection in NestJS

### Basic Service with @Injectable

```typescript
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}

    async findAll(): Promise<User[]> {
        return this.usersRepository.findAll();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User ${id} not found`);
        }
        return user;
    }

    async create(dto: CreateUserDto): Promise<User> {
        // Business rule: check if email exists
        const exists = await this.usersRepository.findByEmail(dto.email);
        if (exists) {
            throw new ConflictException('Email already exists');
        }

        return this.usersRepository.create(dto);
    }

    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id); // Ensures it exists
        return this.usersRepository.update(id, dto);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id); // Ensures it exists
        await this.usersRepository.remove(id);
    }
}
```

### Service with Multiple Dependencies

```typescript
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}

    async create(dto: CreateUserDto): Promise<User> {
        // Validate business rules
        const exists = await this.usersRepository.findByEmail(dto.email);
        if (exists) {
            throw new ConflictException('Email already exists');
        }

        // Create user
        const user = await this.usersRepository.create(dto);

        // Send welcome email (orchestration)
        await this.emailService.sendWelcomeEmail(user.email);

        // Log action
        this.logger.log(`User created: ${user.id}`);

        return user;
    }
}
```

### Registering Services in Modules

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersRepository,
    ],
    exports: [UsersService], // Export if other modules need it
})
export class UsersModule {}
```

---

## Repository Pattern

### Purpose of Repositories

**Repositories abstract data access** - the 'how' of data operations:

```
Service: "Get me all active users sorted by name"
Repository: "Here's the Prisma query that does that"
```

**Repositories are responsible for:**
- ✅ All Prisma operations
- ✅ Query construction
- ✅ Query optimization (select, include)
- ✅ Database error handling
- ✅ Caching database results

**Repositories should NOT:**
- ❌ Contain business logic
- ❌ Know about HTTP
- ❌ Make decisions (that's service layer)

### Repository Template

```typescript
// users.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany({
            where: { isActive: true },
            include: { profile: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
            include: { profile: true },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
            include: { profile: true },
        });
    }

    async remove(id: string): Promise<User> {
        // Soft delete
        return this.prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });
    }

    async count(): Promise<number> {
        return this.prisma.user.count({
            where: { isActive: true },
        });
    }
}
```

### Using Repository in Service

```typescript
@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async create(dto: CreateUserDto): Promise<User> {
        // Business rule: email must be unique
        const exists = await this.usersRepository.findByEmail(dto.email);
        if (exists) {
            throw new ConflictException('Email already exists');
        }

        // Create user via repository
        return this.usersRepository.create({
            email: dto.email,
            name: dto.name,
            profile: {
                create: {
                    age: dto.age,
                },
            },
        });
    }
}
```

---

## Service Design Principles

### 1. Single Responsibility

Each service should have ONE clear purpose:

```typescript
// ✅ GOOD - Single responsibility
@Injectable()
export class UsersService {
    async createUser() {}
    async updateUser() {}
    async deleteUser() {}
}

@Injectable()
export class EmailService {
    async sendEmail() {}
    async sendBulkEmails() {}
}

// ❌ BAD - Too many responsibilities
@Injectable()
export class UsersService {
    async createUser() {}
    async sendWelcomeEmail() {}  // Should be EmailService
    async logUserActivity() {}   // Should be AuditService
    async processPayment() {}    // Should be PaymentService
}
```

### 2. Clear Method Names

```typescript
// ✅ GOOD - Clear intent
async createUser()
async findUserById()
async updateUserEmail()
async deleteUser()

// ❌ BAD - Vague names
async process()
async handle()
async doIt()
async execute()
```

### 3. Return Types

Always use explicit return types:

```typescript
// ✅ GOOD - Explicit types
async createUser(dto: CreateUserDto): Promise<User> {}
async findUsers(): Promise<User[]> {}
async deleteUser(id: string): Promise<void> {}

// ❌ BAD - Implicit any
async createUser(data) {}  // No types!
```

### 4. Error Handling

Services should throw NestJS exceptions:

```typescript
@Injectable()
export class UsersService {
    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findById(id);

        if (!user) {
            throw new NotFoundException(`User ${id} not found`);
        }

        return user;
    }

    async create(dto: CreateUserDto): Promise<User> {
        const exists = await this.usersRepository.findByEmail(dto.email);

        if (exists) {
            throw new ConflictException('Email already exists');
        }

        return this.usersRepository.create(dto);
    }
}
```

### 5. Orchestration

Services orchestrate multiple repositories/services:

```typescript
@Injectable()
export class OrdersService {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly productsService: ProductsService,
        private readonly paymentsService: PaymentsService,
        private readonly emailService: EmailService,
    ) {}

    async createOrder(dto: CreateOrderDto): Promise<Order> {
        // Check product availability
        const product = await this.productsService.checkAvailability(dto.productId);

        // Process payment
        const payment = await this.paymentsService.charge(dto.paymentInfo);

        // Create order
        const order = await this.ordersRepository.create({
            ...dto,
            paymentId: payment.id,
        });

        // Send confirmation email
        await this.emailService.sendOrderConfirmation(order);

        return order;
    }
}
```

---

## Provider Scopes

### Default Scope (Singleton)

```typescript
// Default: Singleton (same instance shared across app)
@Injectable()
export class UsersService {
    // This instance is shared
}
```

### Request Scope

```typescript
// New instance per request (useful for request-specific data)
@Injectable({ scope: Scope.REQUEST })
export class AuditService {
    constructor(
        @Inject(REQUEST) private request: Request,
    ) {}

    logAction(action: string) {
        const userId = this.request['user']?.id;
        // Log with request context
    }
}
```

### Transient Scope

```typescript
// New instance every time it's injected
@Injectable({ scope: Scope.TRANSIENT })
export class HelperService {
    // Each consumer gets a new instance
}
```

**When to use:**
- **DEFAULT (Singleton)**: Most services (best performance)
- **REQUEST**: When you need request-specific data
- **TRANSIENT**: Rarely needed, stateful services

---

## Testing Services

### Unit Tests with Mocking

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let repository: UsersRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: {
                        findById: jest.fn(),
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<UsersRepository>(UsersRepository);
    });

    describe('create', () => {
        it('should create user when email is unique', async () => {
            const dto = {
                email: 'test@example.com',
                name: 'Test User',
                age: 25,
            };

            jest.spyOn(repository, 'findByEmail').mockResolvedValue(null);
            jest.spyOn(repository, 'create').mockResolvedValue({
                id: '123',
                ...dto,
            } as any);

            const result = await service.create(dto);

            expect(result).toBeDefined();
            expect(result.email).toBe(dto.email);
            expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
            expect(repository.create).toHaveBeenCalled();
        });

        it('should throw ConflictException when email exists', async () => {
            const dto = {
                email: 'existing@example.com',
                name: 'Test User',
                age: 25,
            };

            jest.spyOn(repository, 'findByEmail').mockResolvedValue({
                id: '456',
                email: dto.email,
            } as any);

            await expect(service.create(dto)).rejects.toThrow(ConflictException);
            expect(repository.create).not.toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return user when found', async () => {
            const user = { id: '123', email: 'test@example.com' };

            jest.spyOn(repository, 'findById').mockResolvedValue(user as any);

            const result = await service.findOne('123');

            expect(result).toEqual(user);
        });

        it('should throw NotFoundException when user not found', async () => {
            jest.spyOn(repository, 'findById').mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
        });
    });
});
```

### Integration Tests

```typescript
describe('UsersService Integration', () => {
    let service: UsersService;
    let prisma: PrismaService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [PrismaModule],
            providers: [UsersService, UsersRepository],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
        await prisma.user.deleteMany();
    });

    it('should create and find user', async () => {
        const dto = {
            email: 'integration@test.com',
            name: 'Integration Test',
            age: 30,
        };

        const created = await service.create(dto);
        expect(created).toBeDefined();

        const found = await service.findOne(created.id);
        expect(found.email).toBe(dto.email);
    });
});
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Controllers that use services
- [database-patterns.md](database-patterns.md) - Prisma and repository patterns
- [testing-guide.md](testing-guide.md) - Testing strategies
- [complete-examples.md](complete-examples.md) - Full service/repository examples
