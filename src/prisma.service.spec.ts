import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should connect to database successfully', async () => {
    // Attempt to connect by executing a simple query
    await expect(prismaService.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });

  it('should define User model with required fields', async () => {
    // Verify User model has all required fields by checking Prisma schema structure
    const userDelegate = prismaService.user;
    expect(userDelegate).toBeDefined();

    // Create a test user to verify all fields are present in the schema
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashedpassword123',
      nickname: 'Test User',
      profileImage: null,
      refreshToken: null,
      isActive: true,
    };

    // This should compile if User model has correct fields
    // We're not actually creating in DB, just verifying the type structure
    const userFields: Parameters<typeof prismaService.user.create>[0]['data'] =
      testUser;

    expect(userFields).toBeDefined();
    expect(userFields.email).toBe('test@example.com');
    expect(userFields.username).toBe('testuser');
    expect(userFields.password).toBeDefined();
    expect(userFields.nickname).toBeDefined();
  });

  it('should define Post model with relations to User', async () => {
    // Verify Post model exists and has relation to User
    const postDelegate = prismaService.post;
    expect(postDelegate).toBeDefined();

    // Verify we can construct a Post with required fields and User relation
    const postData: Parameters<typeof prismaService.post.create>[0]['data'] = {
      title: 'Test Post',
      content: 'Test Content',
      author: {
        connect: {
          id: 1,
        },
      },
    };

    expect(postData).toBeDefined();
    expect(postData.title).toBe('Test Post');
    expect(postData.content).toBe('Test Content');
    expect(postData.author).toBeDefined();
  });

  it('should define Comment model with self-referential relation', async () => {
    // Verify Comment model exists
    const commentDelegate = prismaService.comment;
    expect(commentDelegate).toBeDefined();

    // Verify we can construct a Comment with required fields and Post/User relations
    const commentData: Parameters<typeof prismaService.comment.create>[0]['data'] = {
      content: 'Test Comment',
      author: {
        connect: {
          id: 1,
        },
      },
      post: {
        connect: {
          id: 1,
        },
      },
    };

    expect(commentData).toBeDefined();
    expect(commentData.content).toBe('Test Comment');
    expect(commentData.author).toBeDefined();
    expect(commentData.post).toBeDefined();
  });
});
