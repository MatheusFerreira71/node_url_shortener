import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ZodExceptionFilter } from '../src/common/filters';
import { configureZod } from '../src/config/zod.config';
import { Link } from '../src/link/link.entity';

describe('Link (e2e)', () => {
	let app: INestApplication;
	let linkRepository: Repository<Link>;
	let authToken: string;
	let testUserId: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		linkRepository = moduleFixture.get(getRepositoryToken(Link));

		configureZod();
		app.useGlobalFilters(new ZodExceptionFilter());

		await app.init();

		// Clean database before starting tests
		await linkRepository.query('DELETE FROM links');
		await linkRepository.query('DELETE FROM users');

		// Create a test user and get auth token
		const userResponse = await request(app.getHttpServer()).post('/user').send({
			name: 'Test User',
			email: 'test@example.com',
			password: 'password123',
		});

		testUserId = userResponse.body.id;

		const loginResponse = await request(app.getHttpServer())
			.post('/auth/login')
			.send({
				email: 'test@example.com',
				password: 'password123',
			});

		authToken = loginResponse.body.access_token;
	}, 10000);

	afterAll(async () => {
		await linkRepository.query('TRUNCATE TABLE links CASCADE');
		await linkRepository.query('TRUNCATE TABLE users CASCADE');
		await linkRepository.query('SELECT 1');
		await app.close();
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	afterEach(async () => {
		await linkRepository.query('DELETE FROM links');
	});

	describe('/link (POST)', () => {
		it('should create a new link without authentication', async () => {
			const linkData = {
				original_url: 'https://example.com',
			};

			const response = await request(app.getHttpServer())
				.post('/link')
				.send(linkData)
				.expect(201);

			expect(response.body).toHaveProperty('hash');
			expect(response.body).toHaveProperty('short_url');
			expect(response.body).toHaveProperty(
				'current_url',
				linkData.original_url,
			);
			expect(response.body).toHaveProperty('created_at');
			expect(response.body.hash).toHaveLength(6);
		});

		it('should create a link with authentication', async () => {
			const linkData = {
				original_url: 'https://example.com/authenticated',
			};

			const response = await request(app.getHttpServer())
				.post('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.send(linkData)
				.expect(201);

			expect(response.body).toHaveProperty('user_id', testUserId);
			expect(response.body).toHaveProperty('hash');
		});

		it('should create a link with expiration date', async () => {
			const expiresAt = '2025-12-31 23:59:59.999 +0000';
			const linkData = {
				original_url: 'https://example.com/expires',
				expires_at: expiresAt,
			};

			const response = await request(app.getHttpServer())
				.post('/link')
				.send(linkData)
				.expect(201);

			expect(response.body).toHaveProperty('expires_at');
			expect(new Date(response.body.expires_at).getTime()).toBeGreaterThan(0);
		});

		it('should fail when original_url is missing', async () => {
			await request(app.getHttpServer()).post('/link').send({}).expect(400);
		});

		it('should fail when original_url is invalid', async () => {
			const linkData = {
				original_url: 'not-a-valid-url',
			};

			await request(app.getHttpServer())
				.post('/link')
				.send(linkData)
				.expect(400);
		});
	});

	describe('/link (GET)', () => {
		it('should list links for authenticated user', async () => {
			// Create some links for the user
			await request(app.getHttpServer())
				.post('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.send({ original_url: 'https://example.com/1' });

			await request(app.getHttpServer())
				.post('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.send({ original_url: 'https://example.com/2' });

			const response = await request(app.getHttpServer())
				.get('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThanOrEqual(2);
			expect(response.body[0]).toHaveProperty('hash');
			expect(response.body[0]).toHaveProperty('short_url');
			expect(response.body[0]).toHaveProperty('times_clicked');
		});

		it('should fail without authentication', async () => {
			await request(app.getHttpServer()).get('/link').expect(401);
		});
	});

	describe('/link/:hash (GET)', () => {
		it('should redirect to original URL', async () => {
			const linkData = {
				original_url: 'https://example.com/redirect',
			};

			const createResponse = await request(app.getHttpServer())
				.post('/link')
				.send(linkData);

			const hash = createResponse.body.hash;

			const response = await request(app.getHttpServer())
				.get(`/link/${hash}`)
				.expect(302);

			expect(response.header.location).toBe(linkData.original_url);
		});

		it('should fail with invalid hash', async () => {
			await request(app.getHttpServer()).get('/link/invalid').expect(400);
		});

		it('should fail with non-existent hash', async () => {
			await request(app.getHttpServer()).get('/link/xxxxxx').expect(404);
		});
	});

	describe('/link/:hash (PATCH)', () => {
		it('should update link current_url', async () => {
			const linkData = {
				original_url: 'https://example.com/original',
			};

			const createResponse = await request(app.getHttpServer())
				.post('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.send(linkData);

			const hash = createResponse.body.hash;

			const updateData = {
				current_url: 'https://example.com/updated',
			};

			const response = await request(app.getHttpServer())
				.patch(`/link/${hash}`)
				.set('Authorization', `Bearer ${authToken}`)
				.send(updateData)
				.expect(200);

			expect(response.body).toHaveProperty(
				'current_url',
				updateData.current_url,
			);
			expect(response.body).toHaveProperty('updated_at');
		});

		it('should fail without authentication', async () => {
			await request(app.getHttpServer())
				.patch('/link/abc123')
				.send({ current_url: 'https://example.com' })
				.expect(401);
		});

		it('should fail when updating non-owned link', async () => {
			// Create another user
			await request(app.getHttpServer()).post('/user').send({
				email: 'other@example.com',
				password: 'password123',
			});

			const otherLoginResponse = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: 'other@example.com',
					password: 'password123',
				});

			const otherToken = otherLoginResponse.body.access_token;

			// Create link with first user
			const createResponse = await request(app.getHttpServer())
				.post('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.send({ original_url: 'https://example.com/test' });

			const hash = createResponse.body.hash;

			// Try to update with second user
			await request(app.getHttpServer())
				.patch(`/link/${hash}`)
				.set('Authorization', `Bearer ${otherToken}`)
				.send({ current_url: 'https://example.com/hacked' })
				.expect(403);
		});
	});

	describe('/link/:hash (DELETE)', () => {
		it('should delete own link', async () => {
			const linkData = {
				original_url: 'https://example.com/to-delete',
			};

			const createResponse = await request(app.getHttpServer())
				.post('/link')
				.set('Authorization', `Bearer ${authToken}`)
				.send(linkData);

			const hash = createResponse.body.hash;

			await request(app.getHttpServer())
				.delete(`/link/${hash}`)
				.set('Authorization', `Bearer ${authToken}`)
				.expect(204);

			// Verify it's deleted
			const linkInDb = await linkRepository.findOne({ where: { hash } });
			expect(linkInDb).toBeNull();
		});

		it('should fail without authentication', async () => {
			await request(app.getHttpServer()).delete('/link/abc123').expect(401);
		});

		it('should fail when deleting non-existent link', async () => {
			await request(app.getHttpServer())
				.delete('/link/xxxxxx')
				.set('Authorization', `Bearer ${authToken}`)
				.expect(404);
		});
	});
});
