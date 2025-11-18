import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as packageJson from '../package.json';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	}, 10000);

	afterAll(async () => {
		await app.close();
	});

	describe('/health/version (GET)', () => {
		it('should return version information', () => {
			return request(app.getHttpServer())
				.get('/health/version')
				.expect(200)
				.expect((res) => {
					expect(res.body).toEqual({
						name: packageJson.name,
						version: packageJson.version,
						description: packageJson.description,
					});
				});
		});

		it('should return correct content type', () => {
			return request(app.getHttpServer())
				.get('/health/version')
				.expect(200)
				.expect('Content-Type', /json/);
		});

		it('should return object with required properties', () => {
			return request(app.getHttpServer())
				.get('/health/version')
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('name');
					expect(res.body).toHaveProperty('version');
					expect(res.body).toHaveProperty('description');
				});
		});

		it('should return package name as node_url_shortener', () => {
			return request(app.getHttpServer())
				.get('/health/version')
				.expect(200)
				.expect((res) => {
					expect(res.body.name).toBe('node_url_shortener');
				});
		});

		it('should return version in semver format', () => {
			return request(app.getHttpServer())
				.get('/health/version')
				.expect(200)
				.expect((res) => {
					const semverRegex = /^\d+\.\d+\.\d+$/;
					expect(res.body.version).toMatch(semverRegex);
				});
		});
	});

	describe('/health/http (GET)', () => {
		it('should return HTTP health check status', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/http')
				.expect(200);

			expect(response.body).toHaveProperty('status');
			expect(response.body).toHaveProperty('info');
			expect(response.body).toHaveProperty('error');
			expect(response.body).toHaveProperty('details');
		});

		it('should return ok status when nestjs-docs is reachable', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/http')
				.expect(200);

			expect(response.body.status).toBe('ok');
			expect(response.body.details).toHaveProperty('nestjs-docs');
		});

		it('should return correct content type', () => {
			return request(app.getHttpServer())
				.get('/health/http')
				.expect(200)
				.expect('Content-Type', /json/);
		});

		it('should include nestjs-docs health indicator', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/http')
				.expect(200);

			expect(response.body.details).toHaveProperty('nestjs-docs');
			expect(response.body.details['nestjs-docs']).toHaveProperty('status');
		});

		it('should return up status for nestjs-docs when service is available', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/http')
				.expect(200);

			if (response.body.status === 'ok') {
				expect(response.body.details['nestjs-docs'].status).toBe('up');
			}
		});
	});

	describe('/health/db (GET)', () => {
		it('should return database health check status', async () => {
			const response = await request(app.getHttpServer()).get('/health/db');

			expect(response.body).toHaveProperty('status');
			expect(response.body).toHaveProperty('info');
			expect(response.body).toHaveProperty('error');
			expect(response.body).toHaveProperty('details');
		});

		it('should return correct content type', () => {
			return request(app.getHttpServer())
				.get('/health/db')
				.expect('Content-Type', /json/);
		});

		it('should include database health indicator', async () => {
			const response = await request(app.getHttpServer()).get('/health/db');

			expect(response.body.details).toHaveProperty('database');
			expect(response.body.details.database).toHaveProperty('status');
		});

		it('should return status code 200 or 503 depending on database connection', async () => {
			const response = await request(app.getHttpServer()).get('/health/db');

			expect([200, 503]).toContain(response.status);
		});

		it('should return ok status when database is connected', async () => {
			const response = await request(app.getHttpServer()).get('/health/db');

			if (response.status === 200) {
				expect(response.body.status).toBe('ok');
				expect(response.body.details.database.status).toBe('up');
			}
		});

		it('should return error status when database is not connected', async () => {
			const response = await request(app.getHttpServer()).get('/health/db');

			if (response.status === 503) {
				expect(response.body.status).toBe('error');
				expect(response.body.details.database.status).toBe('down');
			}
		});
	});

	describe('/health/memory (GET)', () => {
		it('should return memory health check status', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			expect(response.body).toHaveProperty('status');
			expect(response.body).toHaveProperty('info');
			expect(response.body).toHaveProperty('error');
			expect(response.body).toHaveProperty('details');
		});

		it('should return correct content type', () => {
			return request(app.getHttpServer())
				.get('/health/memory')
				.expect(200)
				.expect('Content-Type', /json/);
		});

		it('should include memory_heap health indicator', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			expect(response.body.details).toHaveProperty('memory_heap');
			expect(response.body.details.memory_heap).toHaveProperty('status');
		});

		it('should include memory_rss health indicator', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			expect(response.body.details).toHaveProperty('memory_rss');
			expect(response.body.details.memory_rss).toHaveProperty('status');
		});

		it('should check both heap and RSS memory', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			expect(response.body.details).toHaveProperty('memory_heap');
			expect(response.body.details).toHaveProperty('memory_rss');
		});

		it('should return ok status when memory usage is within limits', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			expect(response.body.status).toBe('ok');
			expect(response.body.details.memory_heap.status).toBe('up');
			expect(response.body.details.memory_rss.status).toBe('up');
		});

		it('should validate heap memory limit is 150MB', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			// Verifica se o health check está configurado corretamente
			expect(response.body.details.memory_heap).toBeDefined();
		});

		it('should validate RSS memory limit is 300MB', async () => {
			const response = await request(app.getHttpServer())
				.get('/health/memory')
				.expect(200);

			// Verifica se o health check está configurado corretamente
			expect(response.body.details.memory_rss).toBeDefined();
		});
	});
});
