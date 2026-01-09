import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');

    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({});
    await prisma.pushSubscription.deleteMany({});
    await prisma.questSubmission.deleteMany({});
    await prisma.qRCodeRedemption.deleteMany({});
    await prisma.qRCode.deleteMany({});
    await prisma.nFT.deleteMany({});
    await prisma.gatedContent.deleteMany({});
    await prisma.quest.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.creator.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('/api/auth/signup (POST)', () => {
    it('should create a new user', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'TestUser',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(signupDto.email);
    });

    it('should fail with duplicate email', async () => {
      const signupDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        nickname: 'User1',
      };

      // First signup
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(signupDto)
        .expect(201);

      // Second signup with same email
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ ...signupDto, nickname: 'User2' })
        .expect(400);
    });

    it('should fail with invalid email format', async () => {
      const signupDto = {
        email: 'invalid-email',
        password: 'password123',
        nickname: 'TestUser',
      };

      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(signupDto)
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    const testUser = {
      email: 'login@example.com',
      password: 'password123',
      nickname: 'LoginUser',
    };

    beforeEach(async () => {
      // Create test user
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('/api/auth/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'me@example.com',
          password: 'password123',
          nickname: 'MeUser',
        });

      accessToken = response.body.accessToken;
    });

    it('should return current user when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe('me@example.com');
      expect(response.body).toHaveProperty('profile');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
