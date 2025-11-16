import {
	type HealthCheckResult,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
	TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import * as packageJson from '../../package.json';
import { HealthController } from './health.controller';

describe('HealthController', () => {
	let controller: HealthController;
	let healthCheckService: HealthCheckService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{
					provide: HealthCheckService,
					useValue: {
						check: jest.fn(),
					},
				},
				{
					provide: HttpHealthIndicator,
					useValue: {
						pingCheck: jest.fn(),
					},
				},
				{
					provide: TypeOrmHealthIndicator,
					useValue: {
						pingCheck: jest.fn(),
					},
				},
				{
					provide: MemoryHealthIndicator,
					useValue: {
						checkHeap: jest.fn(),
						checkRSS: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<HealthController>(HealthController);
		healthCheckService = module.get<HealthCheckService>(HealthCheckService);
	});

	afterEach(() => {
		jest.clearAllMocks();
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

	describe('httpHealth', () => {
		it('should check HTTP health successfully', async () => {
			const mockHealthCheckResult = {
				status: 'ok',
				info: {
					'nestjs-docs': {
						status: 'up',
					},
				},
				error: {},
				details: {
					'nestjs-docs': {
						status: 'up',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.httpHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(healthCheckService.check).toHaveBeenCalledTimes(1);
			expect(healthCheckService.check).toHaveBeenCalledWith([
				expect.any(Function),
			]);
		});

		it('should handle HTTP health check failure', async () => {
			const mockHealthCheckResult = {
				status: 'error',
				info: {},
				error: {
					'nestjs-docs': {
						status: 'down',
					},
				},
				details: {
					'nestjs-docs': {
						status: 'down',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.httpHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(result.status).toBe('error');
		});
	});

	describe('dbHealth', () => {
		it('should check database health successfully', async () => {
			const mockHealthCheckResult = {
				status: 'ok',
				info: {
					database: {
						status: 'up',
					},
				},
				error: {},
				details: {
					database: {
						status: 'up',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.dbHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(healthCheckService.check).toHaveBeenCalledTimes(1);
			expect(healthCheckService.check).toHaveBeenCalledWith([
				expect.any(Function),
			]);
		});

		it('should handle database health check failure', async () => {
			const mockHealthCheckResult = {
				status: 'error',
				info: {},
				error: {
					database: {
						status: 'down',
						message: 'Connection refused',
					},
				},
				details: {
					database: {
						status: 'down',
						message: 'Connection refused',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.dbHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(result.status).toBe('error');
		});
	});

	describe('memoryHealth', () => {
		it('should check memory health successfully', async () => {
			const mockHealthCheckResult = {
				status: 'ok',
				info: {
					memory_heap: {
						status: 'up',
					},
					memory_rss: {
						status: 'up',
					},
				},
				error: {},
				details: {
					memory_heap: {
						status: 'up',
					},
					memory_rss: {
						status: 'up',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.memoryHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(healthCheckService.check).toHaveBeenCalledTimes(1);
			expect(healthCheckService.check).toHaveBeenCalledWith([
				expect.any(Function),
				expect.any(Function),
			]);
		});

		it('should handle memory health check failure when heap exceeds limit', async () => {
			const mockHealthCheckResult = {
				status: 'error',
				info: {
					memory_rss: {
						status: 'up',
					},
				},
				error: {
					memory_heap: {
						status: 'down',
						message: 'Heap memory exceeded threshold',
					},
				},
				details: {
					memory_heap: {
						status: 'down',
						message: 'Heap memory exceeded threshold',
					},
					memory_rss: {
						status: 'up',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.memoryHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(result.status).toBe('error');
		});

		it('should handle memory health check failure when RSS exceeds limit', async () => {
			const mockHealthCheckResult = {
				status: 'error',
				info: {
					memory_heap: {
						status: 'up',
					},
				},
				error: {
					memory_rss: {
						status: 'down',
						message: 'RSS memory exceeded threshold',
					},
				},
				details: {
					memory_heap: {
						status: 'up',
					},
					memory_rss: {
						status: 'down',
						message: 'RSS memory exceeded threshold',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			const result = await controller.memoryHealth();

			expect(result).toEqual(mockHealthCheckResult);
			expect(result.status).toBe('error');
		});

		it('should check both heap and RSS memory limits', async () => {
			const mockHealthCheckResult = {
				status: 'ok',
				info: {
					memory_heap: {
						status: 'up',
					},
					memory_rss: {
						status: 'up',
					},
				},
				error: {},
				details: {
					memory_heap: {
						status: 'up',
					},
					memory_rss: {
						status: 'up',
					},
				},
			} as HealthCheckResult;

			jest
				.spyOn(healthCheckService, 'check')
				.mockResolvedValue(mockHealthCheckResult);

			await controller.memoryHealth();

			const checkCall = (healthCheckService.check as jest.Mock).mock
				.calls[0][0];
			expect(checkCall).toHaveLength(2);
		});
	});
});
