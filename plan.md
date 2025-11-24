# TDD Implementation Plan - Board API

## Phase 1: Foundation & Infrastructure

### Prisma Setup
- [x] should connect to database successfully [31bf7dd]
- [x] should define User model with required fields [a0e9657]
- [x] should define Post model with relations to User
- [ ] should define Comment model with self-referential relation
- [ ] should define PostLike model with unique constraint
- [ ] should define CommentLike model with unique constraint
- [ ] should define File model with optional Post relation
- [ ] should create initial migration successfully

### Configuration Module
- [ ] should load environment variables
- [ ] should provide JWT secret from config
- [ ] should provide database URL from config
- [ ] should validate required config values

### Prisma Service
- [ ] should create PrismaService instance
- [ ] should connect to database on module init
- [ ] should disconnect from database on module destroy
- [ ] should enable shutdown hooks

---

## Phase 2: Common Infrastructure

### JWT Payload Interface
- [ ] should define interface with userId and email fields

### Current User Decorator
- [ ] should extract user from request object
- [ ] should return user payload

### Sentry Exception Filter
- [ ] should catch all exceptions
- [ ] should capture exception to Sentry
- [ ] should return formatted error response for HttpException
- [ ] should return 500 error for unknown exceptions
- [ ] should include error details in development mode

### Logging Interceptor
- [ ] should log incoming request method and URL
- [ ] should log response status code
- [ ] should log request duration
- [ ] should handle errors without breaking flow

---

## Phase 3: Authentication Module

### Password Hashing
- [ ] should hash password with bcrypt
- [ ] should use salt rounds of 10
- [ ] should compare password with hash successfully
- [ ] should reject incorrect password comparison

### JWT Strategy
- [ ] should validate JWT token from Authorization header
- [ ] should extract payload from valid token
- [ ] should reject expired token
- [ ] should reject malformed token

### Refresh Token Strategy
- [ ] should validate refresh token from Authorization header
- [ ] should extract payload from valid refresh token
- [ ] should reject expired refresh token

### Register DTO Validation
- [ ] should accept valid registration data
- [ ] should reject invalid email format
- [ ] should reject username shorter than 3 characters
- [ ] should reject username longer than 20 characters
- [ ] should reject password shorter than 8 characters
- [ ] should reject password without letter
- [ ] should reject password without number
- [ ] should reject nickname shorter than 2 characters

### Login DTO Validation
- [ ] should accept valid login credentials
- [ ] should reject empty email
- [ ] should reject empty password

### Auth Service - Registration
- [ ] should create new user with valid data
- [ ] should hash password before saving
- [ ] should reject duplicate email
- [ ] should reject duplicate username
- [ ] should return user without password field

### Auth Service - Login
- [ ] should authenticate with correct credentials
- [ ] should generate access token on successful login
- [ ] should generate refresh token on successful login
- [ ] should save refresh token to database
- [ ] should reject non-existent email
- [ ] should reject incorrect password
- [ ] should reject inactive user

### Auth Service - Token Refresh
- [ ] should generate new access token with valid refresh token
- [ ] should verify refresh token matches database
- [ ] should reject if refresh token not in database
- [ ] should update refresh token in database

### Auth Service - Logout
- [ ] should clear refresh token from database
- [ ] should succeed even if no refresh token exists

### Auth Controller
- [ ] should handle POST /auth/register
- [ ] should handle POST /auth/login
- [ ] should handle POST /auth/refresh with refresh guard
- [ ] should handle POST /auth/logout with JWT guard

---

## Phase 4: Users Module

### Users Repository
- [ ] should find user by ID
- [ ] should find user by email
- [ ] should find user by username
- [ ] should update user by ID
- [ ] should delete user (soft delete with isActive flag)
- [ ] should return null for non-existent user

### Update User DTO Validation
- [ ] should accept valid update data
- [ ] should accept partial updates
- [ ] should reject invalid email format
- [ ] should reject empty nickname

### Change Password DTO Validation
- [ ] should accept valid password change data
- [ ] should require current password
- [ ] should require new password
- [ ] should validate new password strength

### Users Service - Get Profile
- [ ] should return user profile by ID
- [ ] should exclude password from response
- [ ] should throw NotFoundException for non-existent user

### Users Service - Get Public Profile
- [ ] should return public user info
- [ ] should exclude sensitive fields (email, refreshToken)

### Users Service - Update Profile
- [ ] should update user nickname
- [ ] should update user profile image
- [ ] should not allow email update
- [ ] should not allow username update
- [ ] should throw NotFoundException for non-existent user

### Users Service - Change Password
- [ ] should verify current password before change
- [ ] should hash new password
- [ ] should update password in database
- [ ] should throw UnauthorizedException for incorrect current password

### Users Service - Delete Account
- [ ] should set isActive to false
- [ ] should clear refresh token
- [ ] should not actually delete user record

### Resource Owner Guard
- [ ] should allow user to access own resources
- [ ] should block user from accessing others' resources
- [ ] should extract userId from JWT payload
- [ ] should extract resourceId from params

### Users Controller
- [ ] should handle GET /users/me with JWT guard
- [ ] should handle PUT /users/me with JWT guard
- [ ] should handle DELETE /users/me with JWT guard
- [ ] should handle PUT /users/me/password with JWT guard
- [ ] should handle GET /users/:id (public profile)

---

## Phase 5: Posts Module

### Posts Repository
- [ ] should create post with author relation
- [ ] should find post by ID with author data
- [ ] should find all posts with pagination
- [ ] should update post by ID
- [ ] should soft delete post (isDeleted flag)
- [ ] should increment view count
- [ ] should filter by category
- [ ] should search by title or content

### Create Post DTO Validation
- [ ] should accept valid post data
- [ ] should require title
- [ ] should require content
- [ ] should accept optional category
- [ ] should reject title shorter than 2 characters
- [ ] should reject title longer than 200 characters

### Update Post DTO Validation
- [ ] should accept partial updates
- [ ] should validate title if provided
- [ ] should validate content if provided

### Search Post DTO Validation
- [ ] should accept search query
- [ ] should accept category filter
- [ ] should accept pagination params

### Posts Service - Create
- [ ] should create post with authenticated user as author
- [ ] should return created post with author data
- [ ] should set default viewCount to 0

### Posts Service - Get All
- [ ] should return paginated posts
- [ ] should include author data
- [ ] should exclude soft-deleted posts
- [ ] should order by createdAt descending
- [ ] should apply category filter if provided
- [ ] should return total count for pagination

### Posts Service - Get One
- [ ] should return post by ID
- [ ] should increment view count
- [ ] should include author data
- [ ] should include comments count
- [ ] should include likes/dislikes count
- [ ] should throw NotFoundException for non-existent post
- [ ] should throw NotFoundException for deleted post

### Posts Service - Update
- [ ] should update post title and content
- [ ] should verify user is post author
- [ ] should throw ForbiddenException if not author
- [ ] should throw NotFoundException for non-existent post

### Posts Service - Delete
- [ ] should soft delete post (set isDeleted true)
- [ ] should verify user is post author
- [ ] should throw ForbiddenException if not author
- [ ] should cascade delete related comments (via Prisma)

### Posts Service - Search
- [ ] should search posts by title
- [ ] should search posts by content
- [ ] should search with combined title and content match
- [ ] should filter by category in search
- [ ] should paginate search results

### Posts Controller
- [ ] should handle POST /posts with JWT guard
- [ ] should handle GET /posts with pagination
- [ ] should handle GET /posts/:id
- [ ] should handle PUT /posts/:id with JWT and ResourceOwner guards
- [ ] should handle DELETE /posts/:id with JWT and ResourceOwner guards
- [ ] should handle GET /posts/search

---

## Phase 6: Comments Module

### Comments Repository
- [ ] should create comment with post and author relations
- [ ] should create reply comment with parent relation
- [ ] should find comments by post ID
- [ ] should find comment by ID with author and post data
- [ ] should update comment by ID
- [ ] should soft delete comment
- [ ] should load replies (child comments)

### Create Comment DTO Validation
- [ ] should accept valid comment data
- [ ] should require content
- [ ] should accept optional parentId for replies
- [ ] should validate content length (max 1000 chars)

### Update Comment DTO Validation
- [ ] should accept content update
- [ ] should validate content length

### Comments Service - Create Comment
- [ ] should create top-level comment on post
- [ ] should associate comment with authenticated user
- [ ] should verify post exists
- [ ] should throw NotFoundException if post not found

### Comments Service - Create Reply
- [ ] should create reply to existing comment
- [ ] should set parentId to parent comment
- [ ] should verify parent comment exists
- [ ] should verify parent belongs to same post
- [ ] should throw NotFoundException if parent not found

### Comments Service - Get by Post
- [ ] should return all comments for post
- [ ] should include author data
- [ ] should load replies hierarchically
- [ ] should exclude soft-deleted comments
- [ ] should order by createdAt ascending

### Comments Service - Get One
- [ ] should return comment by ID
- [ ] should include author and post data
- [ ] should include replies
- [ ] should throw NotFoundException for non-existent comment

### Comments Service - Update
- [ ] should update comment content
- [ ] should verify user is comment author
- [ ] should throw ForbiddenException if not author

### Comments Service - Delete
- [ ] should soft delete comment
- [ ] should verify user is comment author
- [ ] should keep replies intact (don't cascade)

### Comments Controller
- [ ] should handle POST /posts/:postId/comments with JWT guard
- [ ] should handle GET /posts/:postId/comments
- [ ] should handle GET /comments/:id
- [ ] should handle PUT /comments/:id with JWT and ResourceOwner guards
- [ ] should handle DELETE /comments/:id with JWT and ResourceOwner guards
- [ ] should handle POST /comments/:id/reply with JWT guard

---

## Phase 7: Likes Module

### Likes Repository (Posts)
- [ ] should create PostLike with user and post
- [ ] should find like by userId and postId
- [ ] should update like status (isLike boolean)
- [ ] should delete like
- [ ] should count likes for post (isLike = true)
- [ ] should count dislikes for post (isLike = false)

### Likes Repository (Comments)
- [ ] should create CommentLike with user and comment
- [ ] should find like by userId and commentId
- [ ] should update like status
- [ ] should delete like
- [ ] should count likes for comment
- [ ] should count dislikes for comment

### Likes Service - Toggle Post Like
- [ ] should create like if not exists
- [ ] should remove like if already liked
- [ ] should switch from dislike to like
- [ ] should verify post exists

### Likes Service - Toggle Post Dislike
- [ ] should create dislike if not exists
- [ ] should remove dislike if already disliked
- [ ] should switch from like to dislike

### Likes Service - Toggle Comment Like
- [ ] should create like if not exists
- [ ] should remove like if already liked
- [ ] should switch from dislike to like
- [ ] should verify comment exists

### Likes Service - Toggle Comment Dislike
- [ ] should create dislike if not exists
- [ ] should remove dislike if already disliked
- [ ] should switch from like to dislike

### Likes Service - Get Counts
- [ ] should return like count for post
- [ ] should return dislike count for post
- [ ] should return like count for comment
- [ ] should return dislike count for comment
- [ ] should return user's like status for post
- [ ] should return user's like status for comment

### Likes Integration with Posts
- [ ] should add like/dislike endpoints to posts controller
- [ ] should handle POST /posts/:id/like with JWT guard
- [ ] should handle POST /posts/:id/dislike with JWT guard
- [ ] should include like counts in post response

### Likes Integration with Comments
- [ ] should add like/dislike endpoints to comments controller
- [ ] should handle POST /comments/:id/like with JWT guard
- [ ] should handle POST /comments/:id/dislike with JWT guard
- [ ] should include like counts in comment response

---

## Phase 8: Files Module

### Files Repository
- [ ] should create file record with metadata
- [ ] should find file by ID
- [ ] should delete file by ID
- [ ] should find files by post ID

### File Upload Configuration
- [ ] should configure multer storage
- [ ] should generate unique filename
- [ ] should preserve file extension
- [ ] should set upload destination folder

### Files Service - Upload
- [ ] should save file to disk
- [ ] should create file record in database
- [ ] should associate file with post if postId provided
- [ ] should validate file type (images only)
- [ ] should validate file size (max 5MB)
- [ ] should reject invalid file types
- [ ] should reject oversized files

### Files Service - Download
- [ ] should return file stream by ID
- [ ] should set correct content-type header
- [ ] should throw NotFoundException if file not found
- [ ] should throw NotFoundException if file deleted from disk

### Files Service - Delete
- [ ] should delete file from disk
- [ ] should delete file record from database
- [ ] should verify user owns the file (via post ownership)
- [ ] should throw ForbiddenException if not owner

### Files Service - Thumbnail Generation (Optional)
- [ ] should generate thumbnail for image upload
- [ ] should resize to 200x200
- [ ] should save thumbnail with suffix
- [ ] should skip thumbnail for non-images

### Files Controller
- [ ] should handle POST /files/upload with JWT guard and multer
- [ ] should handle GET /files/:id
- [ ] should handle DELETE /files/:id with JWT guard
- [ ] should accept multipart/form-data

---

## Phase 9: Integration & E2E Tests

### Auth Flow E2E
- [ ] should complete full registration flow
- [ ] should complete full login flow
- [ ] should refresh token successfully
- [ ] should logout and invalidate refresh token

### Posts Flow E2E
- [ ] should create, read, update, delete post as author
- [ ] should prevent non-author from updating post
- [ ] should prevent non-author from deleting post
- [ ] should increment view count on each read
- [ ] should paginate posts correctly

### Comments Flow E2E
- [ ] should create comment on post
- [ ] should create nested replies
- [ ] should load hierarchical comment tree
- [ ] should update and delete own comments
- [ ] should prevent editing others' comments

### Likes Flow E2E
- [ ] should like and unlike post
- [ ] should switch between like and dislike
- [ ] should reflect accurate counts
- [ ] should prevent duplicate likes from same user

### Files Flow E2E
- [ ] should upload file and associate with post
- [ ] should download uploaded file
- [ ] should delete file with post

### Error Handling E2E
- [ ] should return 401 for unauthenticated requests
- [ ] should return 403 for unauthorized access
- [ ] should return 404 for non-existent resources
- [ ] should return 400 for validation errors
- [ ] should capture errors to Sentry

---

## Phase 10: Documentation & Polish

### Swagger Documentation
- [ ] should install @nestjs/swagger
- [ ] should configure SwaggerModule in main.ts
- [ ] should add ApiTags to all controllers
- [ ] should add ApiOperation to all endpoints
- [ ] should add ApiResponse decorators
- [ ] should document DTOs with ApiProperty
- [ ] should add Bearer auth security scheme
- [ ] should generate API documentation at /api/docs

### Response Standardization
- [ ] should wrap success responses in standard format
- [ ] should wrap error responses in standard format
- [ ] should include pagination metadata
- [ ] should create response interceptor

### Rate Limiting (Optional)
- [ ] should install @nestjs/throttler
- [ ] should configure global rate limit
- [ ] should apply stricter limits to auth endpoints
- [ ] should return 429 when limit exceeded

### CORS Configuration
- [ ] should configure allowed origins
- [ ] should allow credentials
- [ ] should set allowed methods and headers

### Environment Validation
- [ ] should validate all required env vars on startup
- [ ] should provide clear error messages for missing config
- [ ] should use class-validator for env schema

---

## Notes

- Follow strict TDD: Write test first (RED), implement minimal code (GREEN), then refactor
- Each test should be completable in 5-15 minutes
- Run tests after each implementation to ensure green state
- Commit after each completed test or small group of related tests
- Use Sentry to capture all errors in production
- Follow NestJS best practices: layered architecture (Controller → Service → Repository)
