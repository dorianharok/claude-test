# Configuration Management - NestJS ConfigModule

Complete guide to managing configuration using @nestjs/config with type safety and validation.

## Table of Contents

- [ConfigModule Overview](#configmodule-overview)
- [NEVER Use process.env Directly](#never-use-processenv-directly)
- [Basic Setup](#basic-setup)
- [Type-Safe Configuration](#type-safe-configuration)
- [Validation with Joi](#validation-with-joi)
- [Using ConfigService](#using-configservice)
- [Environment Files](#environment-files)

---

## ConfigModule Overview

### Why ConfigModule?

**Problems with process.env:**
- ❌ No type safety
- ❌ No validation
- ❌ Hard to test
- ❌ Scattered throughout code
- ❌ No default values
- ❌ Runtime errors for typos

**Benefits of ConfigModule:**
- ✅ Type-safe configuration
- ✅ Validation at startup
- ✅ Easy to inject anywhere
- ✅ Testable with mocks
- ✅ Clear structure
- ✅ Support for .env files

---

## NEVER Use process.env Directly

### The Rule

```typescript
// ❌ NEVER DO THIS
const timeout = parseInt(process.env.TIMEOUT_MS || '5000');
const dbHost = process.env.DB_HOST || 'localhost';

// ✅ ALWAYS DO THIS
constructor(private configService: ConfigService) {}
const timeout = this.configService.get<number>('TIMEOUT_MS');
const dbHost = this.configService.get<string>('database.host');
```

---

## Basic Setup

### Install Dependencies

```bash
npm install @nestjs/config
npm install --save-dev @types/node
```

### Import ConfigModule

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,          // Make available globally
            envFilePath: '.env',     // Path to .env file
            ignoreEnvFile: false,    // Load .env file
        }),
    ],
})
export class AppModule {}
```

---

## Type-Safe Configuration

### Create Configuration File

```typescript
// config/configuration.ts
export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME || 'mydb',
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
    sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    },
});
```

### Load Configuration

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
    ],
})
export class AppModule {}
```

---

## Validation with Joi

### Install Joi

```bash
npm install joi
```

### Create Validation Schema

```typescript
// config/validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    PORT: Joi.number()
        .default(3000),

    DATABASE_HOST: Joi.string()
        .required(),

    DATABASE_PORT: Joi.number()
        .default(5432),

    DATABASE_USER: Joi.string()
        .required(),

    DATABASE_PASSWORD: Joi.string()
        .required(),

    DATABASE_NAME: Joi.string()
        .required(),

    JWT_SECRET: Joi.string()
        .required()
        .min(32),

    JWT_EXPIRES_IN: Joi.string()
        .default('1h'),

    SENTRY_DSN: Joi.string()
        .uri()
        .optional(),

    SENTRY_TRACES_SAMPLE_RATE: Joi.number()
        .min(0)
        .max(1)
        .default(0.1),
});
```

### Apply Validation

```typescript
// app.module.ts
import { validationSchema } from './config/validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validationSchema,
            validationOptions: {
                allowUnknown: true,    // Allow extra env vars
                abortEarly: false,     // Show all errors
            },
        }),
    ],
})
export class AppModule {}
```

---

## Using ConfigService

### Inject in Services

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
    constructor(private configService: ConfigService) {}

    getDatabaseConfig() {
        const host = this.configService.get<string>('database.host');
        const port = this.configService.get<number>('database.port');

        return { host, port };
    }

    getJwtSecret(): string {
        // Will throw if not set (with validation)
        return this.configService.get<string>('jwt.secret');
    }

    // With default value
    getPort(): number {
        return this.configService.get<number>('port', 3000);
    }

    // Get entire nested object
    getDatabaseSettings() {
        return this.configService.get('database');
    }
}
```

### Use in Controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
    constructor(private configService: ConfigService) {}

    @Get('config')
    getConfig() {
        return {
            environment: this.configService.get('NODE_ENV'),
            port: this.configService.get('port'),
        };
    }
}
```

### Use in main.ts

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('port');

    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

---

## Environment Files

### .env File

```env
# .env
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=mydb

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1h

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Multiple Environment Files

```typescript
// app.module.ts
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                `.env.${process.env.NODE_ENV}`,  // .env.development
                '.env',                           // .env (fallback)
            ],
            load: [configuration],
        }),
    ],
})
export class AppModule {}
```

### Environment-Specific Files

```
.env                  # Default
.env.development      # Development
.env.production       # Production
.env.test             # Testing
```

---

## Advanced Patterns

### Custom Configuration Namespace

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
}));
```

```typescript
// app.module.ts
import databaseConfig from './config/database.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
        }),
    ],
})
export class AppModule {}
```

```typescript
// Usage in service
constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
) {}

getHost() {
    return this.dbConfig.host; // Type-safe!
}
```

### Partial Registration

```typescript
// In specific module
@Module({
    imports: [
        ConfigModule.forFeature(databaseConfig),
    ],
})
export class DatabaseModule {}
```

---

## Best Practices

### 1. Always Use Type-Safe Access

```typescript
// ✅ GOOD
const port = this.configService.get<number>('port');

// ❌ BAD
const port = this.configService.get('port'); // Type is any
```

### 2. Validate at Startup

```typescript
// Use Joi validation to catch errors early
validationSchema: Joi.object({
    DATABASE_PASSWORD: Joi.string().required(),
    JWT_SECRET: Joi.string().required().min(32),
})
```

### 3. Use Namespaces for Organization

```typescript
registerAs('database', () => ({ ... }));
registerAs('jwt', () => ({ ... }));
registerAs('sentry', () => ({ ... }));
```

### 4. Never Commit Secrets

```gitignore
# .gitignore
.env
.env.*
!.env.example
```

### 5. Provide .env.example

```env
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PASSWORD=changeme
JWT_SECRET=your-secret-key-at-least-32-characters-long
```

---

## Testing with ConfigModule

### Mock ConfigService

```typescript
describe('AppService', () => {
    let service: AppService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config = {
                                'database.host': 'test-host',
                                'database.port': 5432,
                                'port': 3000,
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AppService>(AppService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should get database host', () => {
        expect(service.getDatabaseConfig().host).toBe('test-host');
    });
});
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main guide
- [services-and-repositories.md](services-and-repositories.md) - Using ConfigService in services
