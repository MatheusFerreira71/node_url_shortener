import { GoneException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { Link } from '../link.entity';
import { AccessLinkUsecase } from '../usecases/access-link.usecase';

describe('AccessLinkUsecase', () => {
	let usecase: AccessLinkUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;
	let redisService: jest.Mocked<RedisService>;

	const mockLink: Link = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		original_url: 'https://example.com/original',
		current_url: 'https://example.com/current',
		hash: 'abc123',
		times_clicked: 5,
		user_id: null,
		expires_at: new Date(Date.now() + 86400000),
		user: null,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};

	beforeEach(async () => {
		const mockLinkRepository = {
			findOneBy: jest.fn(),
		};

		const mockRedisService = {
			incrementKey: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccessLinkUsecase,
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

		usecase = module.get<AccessLinkUsecase>(AccessLinkUsecase);
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
		it('should return the current URL when the link exists and has not expired', async () => {
			linkRepository.findOneBy.mockResolvedValue(mockLink);
			redisService.incrementKey.mockResolvedValue(undefined);

			const result = await usecase.execute('abc123');

			expect(result).toBe('https://example.com/current');
			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(redisService.incrementKey).toHaveBeenCalledWith(mockLink.id);
		});

		it('should throw NotFoundException when the link does not exist', async () => {
			linkRepository.findOneBy.mockResolvedValue(null);

			await expect(usecase.execute('nonexistent')).rejects.toThrow(
				NotFoundException,
			);
			await expect(usecase.execute('nonexistent')).rejects.toThrow(
				'Link não encontrado',
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({
				hash: 'nonexistent',
			});
			expect(redisService.incrementKey).not.toHaveBeenCalled();
		});

		it('should throw GoneException when the link has expired', async () => {
			const expiredLink: Link = {
				...mockLink,
				expires_at: new Date(Date.now() - 86400000), // -1 day (expired)
			};

			linkRepository.findOneBy.mockResolvedValue(expiredLink);

			await expect(usecase.execute('abc123')).rejects.toThrow(GoneException);
			await expect(usecase.execute('abc123')).rejects.toThrow('Link expirado');

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(redisService.incrementKey).not.toHaveBeenCalled();
		});

		it('should increment the click counter in Redis', async () => {
			linkRepository.findOneBy.mockResolvedValue(mockLink);
			redisService.incrementKey.mockResolvedValue(undefined);

			await usecase.execute('abc123');

			expect(redisService.incrementKey).toHaveBeenCalledTimes(1);
			expect(redisService.incrementKey).toHaveBeenCalledWith(mockLink.id);
		});

		it('should work with links without expiration date', async () => {
			const linkWithoutExpiration: Link = {
				...mockLink,
				expires_at: null,
			};

			linkRepository.findOneBy.mockResolvedValue(linkWithoutExpiration);
			redisService.incrementKey.mockResolvedValue(undefined);

			const result = await usecase.execute('abc123');

			expect(result).toBe('https://example.com/current');
			expect(redisService.incrementKey).toHaveBeenCalledWith(
				linkWithoutExpiration.id,
			);
		});

		it('should call repository and redis service correctly', async () => {
			linkRepository.findOneBy.mockResolvedValue(mockLink);
			redisService.incrementKey.mockResolvedValue(undefined);

			await usecase.execute('abc123');

			expect(linkRepository.findOneBy).toHaveBeenCalledTimes(1);
			expect(redisService.incrementKey).toHaveBeenCalledTimes(1);
		});
	});
});
