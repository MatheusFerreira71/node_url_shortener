import { Test, type TestingModule } from '@nestjs/testing';
import * as packageJson from '../../package.json';
import { HealthController } from './health.controller';

describe('HealthController', () => {
	let controller: HealthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HealthController],
		}).compile();

		controller = module.get<HealthController>(HealthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getVersion', () => {
		it('should return version information from package.json', () => {
			const result = controller.getVersion();

			expect(result).toEqual({
				name: packageJson.name,
				version: packageJson.version,
				description: packageJson.description,
			});
		});

		it('should return an object with name, version and description properties', () => {
			const result = controller.getVersion();

			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('version');
			expect(result).toHaveProperty('description');
		});

		it('should return correct data types', () => {
			const result = controller.getVersion();

			expect(typeof result.name).toBe('string');
			expect(typeof result.version).toBe('string');
			expect(typeof result.description).toBe('string');
		});

		it('should return expected package name', () => {
			const result = controller.getVersion();

			expect(result.name).toBe('node_url_shortener');
		});

		it('should return version in semver format', () => {
			const result = controller.getVersion();
			const semverRegex = /^\d+\.\d+\.\d+$/;

			expect(result.version).toMatch(semverRegex);
		});
	});

	describe('getHealth', () => {
		it('should return status ok', () => {
			const result = controller.getHealth();

			expect(result.status).toBe('ok');
		});

		it('should return timestamp in ISO format', () => {
			const result = controller.getHealth();

			expect(result).toHaveProperty('timestamp');
			expect(typeof result.timestamp).toBe('string');
			expect(() => new Date(result.timestamp)).not.toThrow();
		});
	});
});
