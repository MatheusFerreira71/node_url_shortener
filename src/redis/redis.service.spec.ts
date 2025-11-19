import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

jest.mock('ioredis');

describe('RedisService', () => {
	let service: RedisService;
	let redisMock: jest.Mocked<Redis>;

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		redisMock = {
			incr: jest.fn(),
			get: jest.fn(),
			del: jest.fn(),
			keys: jest.fn(),
			quit: jest.fn(),
		} as unknown as jest.Mocked<Redis>;

		(Redis as unknown as jest.Mock).mockImplementation(() => redisMock);

		mockConfigService.get
			.mockReturnValueOnce('localhost')
			.mockReturnValueOnce(6379);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RedisService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<RedisService>(RedisService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should initialize Redis with correct configuration', () => {
		expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_HOST', {
			infer: true,
		});
		expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_PORT', {
			infer: true,
		});
		expect(Redis).toHaveBeenCalledWith({ host: 'localhost', port: 6379 });
	});

	describe('incrementKey', () => {
		it('should increment the key value in Redis', async () => {
			const linkId = '12345';
			redisMock.incr.mockResolvedValue(1);

			await service.incrementKey(linkId);

			expect(redisMock.incr).toHaveBeenCalledWith('link-12345');
		});

		it('should handle increments for different link IDs', async () => {
			const linkId1 = 'abc123';
			const linkId2 = 'xyz789';

			redisMock.incr.mockResolvedValue(1);

			await service.incrementKey(linkId1);
			await service.incrementKey(linkId2);

			expect(redisMock.incr).toHaveBeenCalledWith('link-abc123');
			expect(redisMock.incr).toHaveBeenCalledWith('link-xyz789');
			expect(redisMock.incr).toHaveBeenCalledTimes(2);
		});
	});

	describe('getKeyValue', () => {
		it('should return the value of a key from Redis', async () => {
			const redisKey = 'link-12345';
			const expectedValue = '42';
			redisMock.get.mockResolvedValue(expectedValue);

			const result = await service.getKeyValue(redisKey);

			expect(redisMock.get).toHaveBeenCalledWith('link-12345');
			expect(result).toBe(expectedValue);
		});

		it('should return null when key does not exist', async () => {
			const redisKey = 'link-nonexistent';
			redisMock.get.mockResolvedValue(null);

			const result = await service.getKeyValue(redisKey);

			expect(redisMock.get).toHaveBeenCalledWith('link-nonexistent');
			expect(result).toBeNull();
		});

		it('should handle different redis keys correctly', async () => {
			const redisKey1 = 'link-abc123';
			const redisKey2 = 'link-xyz789';

			redisMock.get.mockResolvedValueOnce('10').mockResolvedValueOnce('20');

			const result1 = await service.getKeyValue(redisKey1);
			const result2 = await service.getKeyValue(redisKey2);

			expect(result1).toBe('10');
			expect(result2).toBe('20');
			expect(redisMock.get).toHaveBeenCalledWith('link-abc123');
			expect(redisMock.get).toHaveBeenCalledWith('link-xyz789');
		});
	});

	describe('removeKey', () => {
		it('should remove a key from Redis', async () => {
			const redisKey = 'link-12345';
			redisMock.del.mockResolvedValue(1);

			await service.removeKey(redisKey);

			expect(redisMock.del).toHaveBeenCalledWith('link-12345');
		});

		it('should handle removal of different redis keys', async () => {
			const redisKey1 = 'link-abc123';
			const redisKey2 = 'link-xyz789';

			redisMock.del.mockResolvedValue(1);

			await service.removeKey(redisKey1);
			await service.removeKey(redisKey2);

			expect(redisMock.del).toHaveBeenCalledWith('link-abc123');
			expect(redisMock.del).toHaveBeenCalledWith('link-xyz789');
			expect(redisMock.del).toHaveBeenCalledTimes(2);
		});

		it('should handle removal of non-existent keys', async () => {
			const redisKey = 'link-nonexistent';
			redisMock.del.mockResolvedValue(0);

			await service.removeKey(redisKey);

			expect(redisMock.del).toHaveBeenCalledWith('link-nonexistent');
		});
	});

	describe('getAllKeys', () => {
		it('should return all keys matching the link pattern', async () => {
			const expectedKeys = ['link-123', 'link-456', 'link-789'];
			redisMock.keys.mockResolvedValue(expectedKeys);

			const result = await service.getAllKeys();

			expect(redisMock.keys).toHaveBeenCalledWith('link-*');
			expect(result).toEqual(expectedKeys);
		});

		it('should return empty array when no keys exist', async () => {
			redisMock.keys.mockResolvedValue([]);

			const result = await service.getAllKeys();

			expect(redisMock.keys).toHaveBeenCalledWith('link-*');
			expect(result).toEqual([]);
		});

		it('should return all keys with correct pattern', async () => {
			const expectedKeys = [
				'link-abc123',
				'link-xyz789',
				'link-def456',
				'link-ghi012',
			];
			redisMock.keys.mockResolvedValue(expectedKeys);

			const result = await service.getAllKeys();

			expect(result).toHaveLength(4);
			expect(result).toEqual(expectedKeys);
		});
	});

	describe('onModuleDestroy', () => {
		it('should quit Redis connection on module destroy', async () => {
			redisMock.quit.mockResolvedValue('OK');

			await service.onModuleDestroy();

			expect(redisMock.quit).toHaveBeenCalledTimes(1);
		});

		it('should handle quit errors gracefully', async () => {
			const error = new Error('Redis connection error');
			redisMock.quit.mockRejectedValue(error);

			await expect(service.onModuleDestroy()).rejects.toThrow(
				'Redis connection error',
			);
		});
	});
});
