import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ZodExceptionFilter } from '../src/common/filters';
import { configureZod } from '../src/config/zod.config';
import { User } from '../src/user/user.entity';

describe('User (e2e)', () => {
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

	describe('/user (POST)', () => {
		it('should create a new user with valid data', async () => {
			const userData = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201);

			expect(response.body).toHaveProperty('id');
			expect(response.body).toHaveProperty('name', userData.name);
			expect(response.body).toHaveProperty('email', userData.email);
			expect(response.body).toHaveProperty('created_at');
			expect(response.body).not.toHaveProperty('updated_at');
			expect(response.body).not.toHaveProperty('password');
		});

		it('should create a user without name (optional field)', async () => {
			const userData = {
				email: 'jane.doe@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201);

			expect(response.body).toHaveProperty('id');
			expect(response.body).toHaveProperty('email', userData.email);
			expect(response.body).toHaveProperty('created_at');
		});

		it('should return correct content type', async () => {
			const userData = {
				email: 'test@example.com',
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201)
				.expect('Content-Type', /json/);
		});

		it('should fail when email is missing', async () => {
			await request(app.getHttpServer())
				.post('/user')
				.send({
					name: 'Test User',
					password: 'password123',
				})
				.expect(400);
		});

		it('should fail when password is missing', async () => {
			await request(app.getHttpServer())
				.post('/user')
				.send({
					name: 'Test User',
					email: 'test@example.com',
				})
				.expect(400);
		});

		it('should fail when email is invalid', async () => {
			const userData = {
				email: 'invalid-email',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when password is too short', async () => {
			const userData = {
				email: 'test@example.com',
				password: '12345',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when password is too long', async () => {
			const userData = {
				email: 'test@example.com',
				password: 'a'.repeat(51),
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when email is too long', async () => {
			const userData = {
				email: `${'a'.repeat(140)}@example.com`,
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when name is too long', async () => {
			const userData = {
				name: 'a'.repeat(101),
				email: 'test@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(400);

			expect(response.body).toHaveProperty('errors');
		});

		it('should fail when email already exists', async () => {
			const userData = {
				email: 'duplicate@example.com',
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201);

			await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(409);
		});

		it('should persist user to database', async () => {
			const userData = {
				name: 'Persistent User',
				email: 'persistent@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201);

			const userInDb = await userRepository.findOne({
				where: { id: response.body.id },
			});

			expect(userInDb).toBeDefined();
			expect(userInDb?.email).toBe(userData.email);
			expect(userInDb?.name).toBe(userData.name);
		});

		it('should return user with UUID format id', async () => {
			const userData = {
				email: 'uuid@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201);

			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			expect(response.body.id).toMatch(uuidRegex);
		});

		it('should have valid created_at timestamp', async () => {
			const userData = {
				email: 'timestamps@example.com',
				password: 'password123',
			};

			const response = await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(201);

			expect(response.body.created_at).toBeDefined();
			const createdAt = new Date(response.body.created_at);
			expect(createdAt.getTime()).toBeGreaterThan(0);
		});

		it('should handle multiple users creation', async () => {
			const users = [
				{
					email: 'user1@example.com',
					password: 'password123',
				},
				{
					email: 'user2@example.com',
					password: 'password123',
				},
				{
					email: 'user3@example.com',
					password: 'password123',
				},
			];

			await Promise.all(
				users.map((user) =>
					request(app.getHttpServer()).post('/user').send(user).expect(201),
				),
			);

			const count = await userRepository.count();
			expect(count).toBe(3);
		});

		it('should reject email with leading/trailing spaces', async () => {
			const userData = {
				email: '  test.trim@example.com  ',
				password: 'password123',
			};

			await request(app.getHttpServer())
				.post('/user')
				.send(userData)
				.expect(400);
		});
	});
});
