import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ZodExceptionFilter } from '../src/common/filters';
import { configureZod } from '../src/config/zod.config';
import { User } from '../src/user/user.entity';

describe('Auth (e2e)', () => {
	let app: INestApplication;
	let userRepository: Repository<User>;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		userRepository = moduleFixture.get(getRepositoryToken(User));

		configureZod();
		app.useGlobalFilters(new ZodExceptionFilter());

		await app.init();
	}, 10000);

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await userRepository.clear();
	});

	describe('/auth/login (POST)', () => {
		beforeEach(async () => {
			// Create a test user before each login test
			await request(app.getHttpServer()).post('/user').send({
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
			});
		});

		it('should login successfully with valid credentials', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			expect(response.body).toHaveProperty('access_token');
			expect(response.body).toHaveProperty('expires_at');
			expect(typeof response.body.access_token).toBe('string');
			expect(response.body.access_token.length).toBeGreaterThan(0);
		});

		it('should return correct content type', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200)
				.expect('Content-Type', /json/);
		});

		it('should return JWT token with valid structure', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			// JWT has 3 parts separated by dots
			const tokenParts = response.body.access_token.split('.');
			expect(tokenParts).toHaveLength(3);
		});

		it('should return valid expires_at timestamp', async () => {
			const beforeLogin = Date.now();

			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			const afterLogin = Date.now();
			const expiresAt = new Date(response.body.expires_at).getTime();

			// Should expire approximately 1 hour from now
			const expectedExpiry = beforeLogin + 3600 * 1000;
			expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry);
			expect(expiresAt).toBeLessThanOrEqual(afterLogin + 3600 * 1000 + 1000); // +1s tolerance
		});

		it('should fail when email is incorrect', async () => {
			const loginData = {
				email: 'wrong@example.com',
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(404);
		});

		it('should fail when password is incorrect', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'wrongpassword',
			};

			await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(401);
		});

		it('should fail when email is missing', async () => {
			const loginData = {
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(400);
		});

		it('should fail when password is missing', async () => {
			const loginData = {
				email: 'test@example.com',
			};

			await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(400);
		});

		it('should fail when email is invalid', async () => {
			const loginData = {
				email: 'invalid-email',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when password is too short', async () => {
			const loginData = {
				email: 'test@example.com',
				password: '12345',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when password is too long', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'a'.repeat(51),
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when email is too long', async () => {
			const loginData = {
				email: `${'a'.repeat(140)}@example.com`,
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should not expose sensitive user data in response', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			expect(response.body).not.toHaveProperty('password');
			expect(response.body).not.toHaveProperty('id');
			expect(response.body).not.toHaveProperty('email');
		});

		it('should handle multiple consecutive login attempts', async () => {
			const loginData = {
				email: 'test@example.com',
				password: 'password123',
			};

			const response1 = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const response2 = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			// Both should return valid tokens
			expect(response1.body.access_token).toBeDefined();
			expect(response2.body.access_token).toBeDefined();
			// Tokens should be different (due to different timestamps)
			expect(response1.body.access_token).not.toBe(response2.body.access_token);
		});

		it('should handle login for user without name', async () => {
			// Create user without name
			await request(app.getHttpServer()).post('/user').send({
				email: 'noname@example.com',
				password: 'password123',
			});

			const loginData = {
				email: 'noname@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(200);

			expect(response.body).toHaveProperty('access_token');
			expect(response.body).toHaveProperty('expires_at');
		});

		it('should fail with case-sensitive email', async () => {
			const loginData = {
				email: 'TEST@EXAMPLE.COM',
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/auth/login')
				.send(loginData)
				.expect(404);
		});
	});
});
