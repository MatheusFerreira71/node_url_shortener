import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { Env } from '../../types/globals.types';
import { Link } from '../link.entity';
import type { UpdateLinkUsecasePayload } from '../link.types';
import { UpdateLinkUsecase } from '../usecases/update-link.usecase';

describe('UpdateLinkUsecase', () => {
	let usecase: UpdateLinkUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;
	let configService: jest.Mocked<ConfigService<Env, true>>;

	const mockLink: Link = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		original_url: 'https://example.com/original',
		current_url: 'https://example.com/current',
		hash: 'abc123',
		times_clicked: 5,
		user_id: 'user-123',
		expires_at: new Date('2025-12-31'),
		user: null,
		created_at: new Date('2025-01-01'),
		updated_at: new Date('2025-01-02'),
		deleted_at: null,
	};

	beforeEach(async () => {
		const mockLinkRepository = {
			findOneBy: jest.fn(),
			save: jest.fn(),
		};

		const mockConfigService = {
			get: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UpdateLinkUsecase,
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

		usecase = module.get<UpdateLinkUsecase>(UpdateLinkUsecase);
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
		it('should successfully update a link when user owns it', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			const updatedLink = {
				...mockLink,
				current_url: 'https://example.com/updated',
				updated_at: new Date('2025-01-03'),
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.save.mockResolvedValue(updatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute(payload);

			expect(result).toEqual({
				current_url: 'https://example.com/updated',
				hash: 'abc123',
				expires_at: updatedLink.expires_at,
				created_at: updatedLink.created_at,
				user_id: 'user-123',
				updated_at: updatedLink.updated_at,
				short_url: 'http://localhost:3000/abc123',
			});
			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.save).toHaveBeenCalledWith({
				...mockLink,
				current_url: 'https://example.com/updated',
			});
		});

		it('should throw NotFoundException when link does not exist', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'nonexistent',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			linkRepository.findOneBy.mockResolvedValue(null);

			await expect(usecase.execute(payload)).rejects.toThrow(NotFoundException);
			await expect(usecase.execute(payload)).rejects.toThrow(
				'Link não encontrado',
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({
				hash: 'nonexistent',
			});
			expect(linkRepository.save).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when user does not own the link', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'different-user',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);

			await expect(usecase.execute(payload)).rejects.toThrow(
				ForbiddenException,
			);
			await expect(usecase.execute(payload)).rejects.toThrow(
				'Ação não permitida',
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.save).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when user_id is not provided', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: '',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);

			await expect(usecase.execute(payload)).rejects.toThrow(
				ForbiddenException,
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.save).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when link has no owner', async () => {
			const linkWithoutOwner: Link = {
				...mockLink,
				user_id: null,
			};

			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			linkRepository.findOneBy.mockResolvedValue(linkWithoutOwner);

			await expect(usecase.execute(payload)).rejects.toThrow(
				ForbiddenException,
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.save).not.toHaveBeenCalled();
		});

		it('should include short_url in the response', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			const updatedLink = {
				...mockLink,
				current_url: 'https://example.com/updated',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.save.mockResolvedValue(updatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute(payload);

			expect(result.short_url).toBe('http://localhost:3000/abc123');
			expect(configService.get).toHaveBeenCalledWith('BASE_URL');
		});

		it('should use BASE_URL from config service', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			const customBaseUrl = 'https://custom.url';
			const updatedLink = {
				...mockLink,
				current_url: 'https://example.com/updated',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.save.mockResolvedValue(updatedLink);
			configService.get.mockReturnValue(customBaseUrl);

			const result = await usecase.execute(payload);

			expect(configService.get).toHaveBeenCalledWith('BASE_URL');
			expect(result.short_url).toBe(`${customBaseUrl}/abc123`);
		});

		it('should preserve link properties that are not being updated', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/new-url',
				user_id: 'user-123',
			};

			const updatedLink = {
				...mockLink,
				current_url: 'https://example.com/new-url',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.save.mockResolvedValue(updatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute(payload);

			expect(result.hash).toBe(mockLink.hash);
			expect(result.user_id).toBe(mockLink.user_id);
			expect(result.expires_at).toEqual(updatedLink.expires_at);
			expect(result.created_at).toEqual(updatedLink.created_at);
		});

		it('should save the link with updated current_url', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/brand-new-url',
				user_id: 'user-123',
			};

			const updatedLink = {
				...mockLink,
				current_url: 'https://example.com/brand-new-url',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.save.mockResolvedValue(updatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			await usecase.execute(payload);

			expect(linkRepository.save).toHaveBeenCalledWith({
				...mockLink,
				current_url: 'https://example.com/brand-new-url',
			});
		});

		it('should return updated timestamps from save operation', async () => {
			const payload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			const newUpdateDate = new Date('2025-11-18');
			const updatedLink = {
				...mockLink,
				current_url: 'https://example.com/updated',
				updated_at: newUpdateDate,
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.save.mockResolvedValue(updatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await usecase.execute(payload);

			expect(result.updated_at).toEqual(newUpdateDate);
		});
	});
});
