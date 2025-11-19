import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { Env } from '../../types/globals.types';
import { Link } from '../link.entity';
import { ListLinksByUserUsecase } from '../usecases/list-links-by-user.usecase';

describe('ListLinksByUserUsecase', () => {
	let usecase: ListLinksByUserUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;
	let configService: jest.Mocked<ConfigService<Env, true>>;

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
			current_url: 'https://example.com/page2-updated',
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
			findBy: jest.fn(),
		};

		const mockConfigService = {
			get: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ListLinksByUserUsecase,
				{
					provide: getRepositoryToken(Link),
					useValue: mockLinkRepository,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		usecase = module.get<ListLinksByUserUsecase>(ListLinksByUserUsecase);
		linkRepository = module.get(getRepositoryToken(Link));
		configService = module.get(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(usecase).toBeDefined();
	});

	describe('execute', () => {
		it('should return a list of links for a given user', async () => {
			linkRepository.findBy.mockResolvedValue(mockLinks);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-123');

			expect(result).toHaveLength(2);
			expect(linkRepository.findBy).toHaveBeenCalledWith({
				user_id: 'user-123',
			});
			expect(configService.get).toHaveBeenCalledWith('BASE_URL');
		});

		it('should map links with short_url property', async () => {
			linkRepository.findBy.mockResolvedValue(mockLinks);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-123');

			expect(result[0].short_url).toBe('http://localhost:3000/link/abc123');
			expect(result[1].short_url).toBe('http://localhost:3000/link/def456');
		});

		it('should include all required properties in returned links', async () => {
			linkRepository.findBy.mockResolvedValue([mockLinks[0]]);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-123');

			expect(result[0]).toHaveProperty('current_url');
			expect(result[0]).toHaveProperty('hash');
			expect(result[0]).toHaveProperty('expires_at');
			expect(result[0]).toHaveProperty('created_at');
			expect(result[0]).toHaveProperty('user_id');
			expect(result[0]).toHaveProperty('original_url');
			expect(result[0]).toHaveProperty('times_clicked');
			expect(result[0]).toHaveProperty('updated_at');
			expect(result[0]).toHaveProperty('short_url');
		});

		it('should return empty array when user has no links', async () => {
			linkRepository.findBy.mockResolvedValue([]);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-456');

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
			expect(linkRepository.findBy).toHaveBeenCalledWith({
				user_id: 'user-456',
			});
		});

		it('should throw ForbiddenException when user_id is empty string', async () => {
			await expect(usecase.execute('')).rejects.toThrow(ForbiddenException);
			await expect(usecase.execute('')).rejects.toThrow('Ação não permitida');

			expect(linkRepository.findBy).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when user_id is not provided', async () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing null case
			await expect(usecase.execute(null as any)).rejects.toThrow(
				ForbiddenException,
			);

			expect(linkRepository.findBy).not.toHaveBeenCalled();
		});

		it('should correctly map link properties including updated current_url', async () => {
			linkRepository.findBy.mockResolvedValue([mockLinks[1]]);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-123');

			expect(result[0].current_url).toBe('https://example.com/page2-updated');
			expect(result[0].original_url).toBe('https://example.com/page2');
			expect(result[0].hash).toBe('def456');
			expect(result[0].times_clicked).toBe(5);
		});

		it('should handle links with null expires_at', async () => {
			linkRepository.findBy.mockResolvedValue([mockLinks[1]]);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-123');

			expect(result[0].expires_at).toBeNull();
		});

		it('should use BASE_URL from config service to build short URLs', async () => {
			const customBaseUrl = 'https://short.url';
			linkRepository.findBy.mockResolvedValue([mockLinks[0]]);
			configService.get.mockReturnValue(customBaseUrl);

			const result = await usecase.execute('user-123');

			expect(configService.get).toHaveBeenCalledWith('BASE_URL');
			expect(result[0].short_url).toBe(`${customBaseUrl}/link/abc123`);
		});

		it('should preserve all timestamps correctly', async () => {
			linkRepository.findBy.mockResolvedValue([mockLinks[0]]);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute('user-123');

			expect(result[0].created_at).toEqual(mockLinks[0].created_at);
			expect(result[0].updated_at).toEqual(mockLinks[0].updated_at);
			expect(result[0].expires_at).toEqual(mockLinks[0].expires_at);
		});
	});
});
