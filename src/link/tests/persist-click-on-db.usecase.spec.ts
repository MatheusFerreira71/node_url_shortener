import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { Link } from '../link.entity';
import { PersistClickOnDbUsecase } from '../usecases/persist-click-on-db.usecase';

describe('PersistClickOnDbUsecase', () => {
	let usecase: PersistClickOnDbUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;
	let redisService: jest.Mocked<RedisService>;

	const mockLinks: Link[] = [
		{
			id: '123e4567-e89b-12d3-a456-426614174001',
			original_url: 'https://example.com/page1',
			current_url: 'https://example.com/page1',
			hash: 'abc123',
			times_clicked: 10,
			user_id: 'user-123',
			expires_at: new Date('2025-12-31'),
			user: null,
			created_at: new Date('2025-01-01'),
			updated_at: new Date('2025-01-02'),
			deleted_at: null,
		},
		{
			id: '123e4567-e89b-12d3-a456-426614174002',
			original_url: 'https://example.com/page2',
			current_url: 'https://example.com/page2',
			hash: 'def456',
			times_clicked: 5,
			user_id: 'user-123',
			expires_at: null,
			user: null,
			created_at: new Date('2025-01-03'),
			updated_at: new Date('2025-01-04'),
			deleted_at: null,
		},
	];

	beforeEach(async () => {
		const mockLinkRepository = {
			findOneBy: jest.fn(),
			save: jest.fn(),
		};

		const mockRedisService = {
			getAllKeys: jest.fn(),
			getKeyValue: jest.fn(),
			removeKey: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PersistClickOnDbUsecase,
				{
					provide: getRepositoryToken(Link),
					useValue: mockLinkRepository,
				},
				{
					provide: RedisService,
					useValue: mockRedisService,
				},
			],
		}).compile();

		usecase = module.get<PersistClickOnDbUsecase>(PersistClickOnDbUsecase);
		linkRepository = module.get(getRepositoryToken(Link));
		redisService = module.get(RedisService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(usecase).toBeDefined();
	});

	describe('execute', () => {
		it('should persist clicks from Redis to database', async () => {
			const redisKeys = [
				'link-123e4567-e89b-12d3-a456-426614174001',
				'link-123e4567-e89b-12d3-a456-426614174002',
			];

			const link1 = { ...mockLinks[0] };
			const link2 = { ...mockLinks[1] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy
				.mockResolvedValueOnce(link1)
				.mockResolvedValueOnce(link2);
			redisService.getKeyValue
				.mockResolvedValueOnce('3')
				.mockResolvedValueOnce('7');
			linkRepository.save
				.mockResolvedValueOnce({ ...link1, times_clicked: 13 })
				.mockResolvedValueOnce({ ...link2, times_clicked: 12 });
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(redisService.getAllKeys).toHaveBeenCalledTimes(1);
			expect(linkRepository.findOneBy).toHaveBeenCalledTimes(2);
			expect(linkRepository.save).toHaveBeenCalledTimes(2);
			expect(redisService.removeKey).toHaveBeenCalledTimes(2);
		});

		it('should correctly increment times_clicked with Redis values', async () => {
			const redisKeys = ['link-123e4567-e89b-12d3-a456-426614174001'];
			const link = { ...mockLinks[0] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy.mockResolvedValue(link);
			redisService.getKeyValue.mockResolvedValue('5');
			linkRepository.save.mockResolvedValue({
				...link,
				times_clicked: 15,
			});
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(linkRepository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					times_clicked: 15, // 10 + 5
				}),
			);
		});

		it('should handle when no Redis keys exist', async () => {
			redisService.getAllKeys.mockResolvedValue([]);

			await usecase.execute();

			expect(redisService.getAllKeys).toHaveBeenCalledTimes(1);
			expect(linkRepository.findOneBy).not.toHaveBeenCalled();
			expect(linkRepository.save).not.toHaveBeenCalled();
			expect(redisService.removeKey).not.toHaveBeenCalled();
		});

		it('should filter out null links from database query', async () => {
			const redisKeys = [
				'link-123e4567-e89b-12d3-a456-426614174001',
				'link-nonexistent-id',
			];

			const link = { ...mockLinks[0] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy
				.mockResolvedValueOnce(link)
				.mockResolvedValueOnce(null);
			redisService.getKeyValue.mockResolvedValue('3');
			linkRepository.save.mockResolvedValue({
				...link,
				times_clicked: 13,
			});
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(linkRepository.save).toHaveBeenCalledTimes(1);
			expect(redisService.removeKey).toHaveBeenCalledTimes(2); // Still removes all keys
		});

		it('should remove all Redis keys after processing', async () => {
			const redisKeys = [
				'link-123e4567-e89b-12d3-a456-426614174001',
				'link-123e4567-e89b-12d3-a456-426614174002',
			];

			const link1 = { ...mockLinks[0] };
			const link2 = { ...mockLinks[1] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy
				.mockResolvedValueOnce(link1)
				.mockResolvedValueOnce(link2);
			redisService.getKeyValue.mockResolvedValue('1');
			linkRepository.save.mockResolvedValue(link1);
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(redisService.removeKey).toHaveBeenCalledWith(redisKeys[0]);
			expect(redisService.removeKey).toHaveBeenCalledWith(redisKeys[1]);
			expect(redisService.removeKey).toHaveBeenCalledTimes(2);
		});

		it('should handle clicks value as 0 when Redis returns null', async () => {
			const redisKeys = ['link-123e4567-e89b-12d3-a456-426614174001'];
			const link = { ...mockLinks[0] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy.mockResolvedValue(link);
			redisService.getKeyValue.mockResolvedValue(null);
			linkRepository.save.mockResolvedValue(link);
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(linkRepository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					times_clicked: 10, // 10 + 0
				}),
			);
		});

		it('should parse Redis key to extract link id', async () => {
			const redisKeys = ['link-123e4567-e89b-12d3-a456-426614174001'];
			const link = { ...mockLinks[0] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy.mockResolvedValue(link);
			redisService.getKeyValue.mockResolvedValue('2');
			linkRepository.save.mockResolvedValue(link);
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({
				id: '123e4567-e89b-12d3-a456-426614174001',
			});
		});

		it('should process all links in parallel for findOneBy', async () => {
			const redisKeys = [
				'link-123e4567-e89b-12d3-a456-426614174001',
				'link-123e4567-e89b-12d3-a456-426614174002',
			];

			const link1 = { ...mockLinks[0] };
			const link2 = { ...mockLinks[1] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy
				.mockResolvedValueOnce(link1)
				.mockResolvedValueOnce(link2);
			redisService.getKeyValue.mockResolvedValue('1');
			linkRepository.save.mockResolvedValue(link1);
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			// Verify parallel processing by checking both findOneBy calls happened
			expect(linkRepository.findOneBy).toHaveBeenCalledTimes(2);
		});

		it('should convert string values to numbers for addition', async () => {
			const redisKeys = ['link-123e4567-e89b-12d3-a456-426614174001'];
			const link = { ...mockLinks[0] };

			redisService.getAllKeys.mockResolvedValue(redisKeys);
			linkRepository.findOneBy.mockResolvedValue(link);
			redisService.getKeyValue.mockResolvedValue('15'); // String value
			linkRepository.save.mockResolvedValue({
				...link,
				times_clicked: 25,
			});
			redisService.removeKey.mockResolvedValue(undefined);

			await usecase.execute();

			expect(linkRepository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					times_clicked: 25, // 10 + 15 (both converted to numbers)
				}),
			);
		});

		it('should execute without returning any value', async () => {
			redisService.getAllKeys.mockResolvedValue([]);

			const result = await usecase.execute();

			expect(result).toBeUndefined();
		});
	});
});
