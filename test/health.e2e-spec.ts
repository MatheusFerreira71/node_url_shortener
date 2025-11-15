import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as packageJson from '../package.json';
import { HealthModule } from '../src/health/health.module';

describe('Health (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [HealthModule],
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

	describe('/health/status (GET)', () => {
		it('should return status ok', () => {
			return request(app.getHttpServer())
				.get('/health/status')
				.expect(200)
				.expect((res) => {
					expect(res.body.status).toBe('ok');
				});
		});

		it('should return timestamp', () => {
			return request(app.getHttpServer())
				.get('/health/status')
				.expect(200)
				.expect((res) => {
					expect(res.body).toHaveProperty('timestamp');
					expect(typeof res.body.timestamp).toBe('string');
				});
		});

		it('should return valid ISO timestamp', () => {
			return request(app.getHttpServer())
				.get('/health/status')
				.expect(200)
				.expect((res) => {
					const timestamp = new Date(res.body.timestamp);
					expect(timestamp.toISOString()).toBe(res.body.timestamp);
				});
		});
	});
});
