# Validation Patterns - class-validator with NestJS

Complete guide to input validation using class-validator and DTOs for type-safe validation in NestJS.

## Table of Contents

- [Why class-validator?](#why-class-validator)
- [Basic Validation Decorators](#basic-validation-decorators)
- [Creating DTOs](#creating-dtos)
- [Validation Pipe](#validation-pipe)
- [Advanced Patterns](#advanced-patterns)
- [Custom Validators](#custom-validators)
- [Error Handling](#error-handling)

---

## Why class-validator?

### Benefits

**Type Safety:**
- ✅ Full TypeScript integration
- ✅ Decorators for validation rules
- ✅ Automatic type inference
- ✅ Compile-time type checking

**NestJS Integration:**
- ✅ Built-in ValidationPipe
- ✅ Automatic validation on routes
- ✅ DTO transformation
- ✅ Detailed error messages

**Developer Experience:**
- ✅ Intuitive decorator API
- ✅ Composable validation rules
- ✅ Excellent error messages
- ✅ Works with class-transformer

---

## Basic Validation Decorators

### Primitive Types

```typescript
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsDate,
    IsEmail,
    IsUrl,
    IsUUID,
    IsEnum,
} from 'class-validator';

export class ExampleDto {
    @IsString()
    name: string;

    @IsNumber()
    age: number;

    @IsBoolean()
    isActive: boolean;

    @IsEmail()
    email: string;

    @IsUrl()
    website: string;

    @IsUUID()
    id: string;

    @IsEnum(['admin', 'user', 'guest'])
    role: string;
}
```

### String Validators

```typescript
import {
    IsString,
    MinLength,
    MaxLength,
    Length,
    Matches,
    IsAlpha,
    IsAlphanumeric,
    IsNotEmpty,
} from 'class-validator';

export class StringValidationDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @MinLength(8)
    @MaxLength(20)
    password: string;

    @IsString()
    @Length(10, 15)
    phoneNumber: string;

    @IsString()
    @Matches(/^[A-Z][a-z]+$/)
    firstName: string;

    @IsAlpha()
    onlyLetters: string;

    @IsAlphanumeric()
    alphanumeric: string;
}
```

### Number Validators

```typescript
import {
    IsNumber,
    IsInt,
    IsPositive,
    IsNegative,
    Min,
    Max,
} from 'class-validator';

export class NumberValidationDto {
    @IsNumber()
    price: number;

    @IsInt()
    quantity: number;

    @IsPositive()
    positiveNumber: number;

    @IsNegative()
    negativeNumber: number;

    @Min(0)
    @Max(100)
    percentage: number;

    @IsInt()
    @Min(18)
    @Max(120)
    age: number;
}
```

### Date Validators

```typescript
import { IsDate, MinDate, MaxDate } from 'class-validator';
import { Type } from 'class-transformer';

export class DateValidationDto {
    @IsDate()
    @Type(() => Date)
    birthDate: Date;

    @IsDate()
    @MinDate(new Date())
    @Type(() => Date)
    futureDate: Date;

    @IsDate()
    @MaxDate(new Date())
    @Type(() => Date)
    pastDate: Date;
}
```

---

## Creating DTOs

### Basic DTO Example

```typescript
// dto/create-user.dto.ts
import {
    IsEmail,
    IsString,
    IsNumber,
    MinLength,
    MaxLength,
    Min,
    Max,
} from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsNumber()
    @Min(18)
    @Max(120)
    age: number;
}
```

### Optional Fields

```typescript
import { IsString, IsEmail, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsUrl()
    @IsOptional()
    website?: string;
}
```

### Nested Objects

```typescript
import { IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsString()
    @Matches(/^\d{5}$/)
    zipCode: string;
}

export class CreateUserDto {
    @IsString()
    name: string;

    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;
}
```

### Arrays

```typescript
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CreatePostDto {
    @IsString()
    title: string;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    tags: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CommentDto)
    comments: CommentDto[];
}
```

---

## Validation Pipe

### Global Validation Pipe

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Apply validation globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,              // Strip properties not in DTO
            forbidNonWhitelisted: true,    // Throw error for unknown properties
            transform: true,               // Auto-transform to DTO instance
            transformOptions: {
                enableImplicitConversion: true, // Auto-convert types
            },
        }),
    );

    await app.listen(3000);
}
bootstrap();
```

### Route-Level Validation

```typescript
import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';

@Controller('users')
export class UsersController {
    // Apply to specific route
    @Post()
    @UsePipes(new ValidationPipe())
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }
}
```

### Custom Validation Pipe Options

```typescript
@Post()
@UsePipes(
    new ValidationPipe({
        skipMissingProperties: false,
        forbidUnknownValues: true,
        disableErrorMessages: false,
        validationError: {
            target: false,
            value: false,
        },
    }),
)
create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
}
```

---

## Advanced Patterns

### Conditional Validation

```typescript
import { ValidateIf, IsString, IsNumber } from 'class-validator';

export class ConditionalDto {
    @IsString()
    type: 'email' | 'phone';

    @ValidateIf(o => o.type === 'email')
    @IsEmail()
    contactEmail?: string;

    @ValidateIf(o => o.type === 'phone')
    @IsString()
    contactPhone?: string;
}
```

### Custom Error Messages

```typescript
export class CreateUserDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    name: string;

    @IsNumber({}, { message: 'Age must be a number' })
    @Min(18, { message: 'You must be at least 18 years old' })
    @Max(120, { message: 'Age cannot exceed 120' })
    age: number;
}
```

### Validation Groups

```typescript
export class UserDto {
    @IsString({ groups: ['create'] })
    password: string;

    @IsString({ groups: ['create', 'update'] })
    name: string;

    @IsEmail({}, { groups: ['create', 'update'] })
    email: string;
}

// In controller
@Post()
create(@Body() dto: UserDto) {
    // Validates 'create' group only
    return this.usersService.create(dto);
}

@Put(':id')
update(@Param('id') id: string, @Body() dto: UserDto) {
    // Validates 'update' group only
    return this.usersService.update(id, dto);
}
```

### Transformation

```typescript
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @IsEmail()
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @IsString()
    @Transform(({ value }) => value.trim())
    name: string;

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    age: number;
}
```

---

## Custom Validators

### Simple Custom Validator

```typescript
import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
    validate(password: string) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    }

    defaultMessage() {
        return 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character';
    }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsStrongPasswordConstraint,
        });
    };
}

// Usage
export class CreateUserDto {
    @IsStrongPassword()
    password: string;
}
```

### Async Custom Validator

```typescript
import { Injectable } from '@nestjs/common';
import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { UsersService } from '../users.service';

@ValidatorConstraint({ name: 'IsEmailUnique', async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly usersService: UsersService) {}

    async validate(email: string) {
        const user = await this.usersService.findByEmail(email);
        return !user;
    }

    defaultMessage(args: ValidationArguments) {
        return `Email ${args.value} is already taken`;
    }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsEmailUniqueConstraint,
        });
    };
}

// Usage
export class CreateUserDto {
    @IsEmail()
    @IsEmailUnique()
    email: string;
}
```

---

## Error Handling

### Validation Error Format

```typescript
// When validation fails, NestJS returns:
{
    "statusCode": 400,
    "message": [
        "email must be an email",
        "name must be longer than or equal to 2 characters",
        "age must not be less than 18"
    ],
    "error": "Bad Request"
}
```

### Custom Exception Factory

```typescript
// main.ts
app.useGlobalPipes(
    new ValidationPipe({
        exceptionFactory: (errors) => {
            const messages = errors.map(error => ({
                field: error.property,
                errors: Object.values(error.constraints || {}),
            }));

            return new BadRequestException({
                statusCode: 400,
                message: 'Validation failed',
                errors: messages,
            });
        },
    }),
);

// Response format:
{
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "errors": ["email must be an email"]
        },
        {
            "field": "age",
            "errors": ["age must not be less than 18"]
        }
    ]
}
```

### Handling in Controller

```typescript
@Controller('users')
export class UsersController {
    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        // If validation fails, ValidationPipe automatically throws BadRequestException
        // No need for try-catch for validation errors
        return this.usersService.create(createUserDto);
    }
}
```

---

## Complete Examples

### Complex DTO Example

```typescript
import {
    IsEmail,
    IsString,
    IsNumber,
    IsEnum,
    IsArray,
    IsOptional,
    ValidateNested,
    MinLength,
    MaxLength,
    Min,
    Max,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    GUEST = 'guest',
}

class SocialLinksDto {
    @IsUrl()
    @IsOptional()
    twitter?: string;

    @IsUrl()
    @IsOptional()
    linkedin?: string;

    @IsUrl()
    @IsOptional()
    github?: string;
}

class ProfileDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    lastName: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @ValidateNested()
    @Type(() => SocialLinksDto)
    @IsOptional()
    socialLinks?: SocialLinksDto;
}

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(100)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain uppercase, lowercase and number',
    })
    password: string;

    @ValidateNested()
    @Type(() => ProfileDto)
    profile: ProfileDto;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    interests: string[];

    @IsNumber()
    @Min(18)
    @Max(120)
    age: number;
}
```

### PartialType Pattern

```typescript
import { PartialType } from '@nestjs/mapped-types';

// All fields from CreateUserDto become optional
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### PickType Pattern

```typescript
import { PickType } from '@nestjs/mapped-types';

// Only pick specific fields
export class LoginDto extends PickType(CreateUserDto, ['email', 'password']) {}
```

### OmitType Pattern

```typescript
import { OmitType } from '@nestjs/mapped-types';

// Exclude specific fields
export class PublicUserDto extends OmitType(CreateUserDto, ['password']) {}
```

---

**Related Files:**
- [SKILL.md](../SKILL.md) - Main guide
- [routing-and-controllers.md](routing-and-controllers.md) - Using DTOs in controllers
- [services-and-repositories.md](services-and-repositories.md) - Using DTOs in services
