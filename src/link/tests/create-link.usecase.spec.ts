import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Link } from '../link.entity';
import type { CreateLinkDto } from '../link.types';
import { CreateLinkUsecase } from '../usecases/create-link.usecase';
import { HashIsInvalidUsecase } from '../usecases/hash-is-invalid.usecase';

jest.mock('nanoid', () => ({
	nanoid: jest.fn(),
}));

describe('CreateLinkUsecase', () => {
	let usecase: CreateLinkUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;
	let hashIsValidUsecase: jest.Mocked<HashIsInvalidUsecase>;

	const { nanoid } = require('nanoid');

	const mockCreateLinkDto: CreateLinkDto = {
		original_url: 'https://example.com/very-long-url',
		expires_at: new Date(Date.now() + 86400000), // +1 day
		user_id: '123e4567-e89b-12d3-a456-426614174000',
	};

	const mockLink: Link = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		original_url: 'https://example.com/very-long-url',
		current_url: 'https://example.com/very-long-url',
		hash: 'abc123',
		times_clicked: 0,
		user_id: '123e4567-e89b-12d3-a456-426614174000',
		expires_at: new Date(Date.now() + 86400000),
		user: null,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};

	beforeEach(async () => {
		const mockLinkRepository = {
			create: jest.fn(),
			save: jest.fn(),
		};

		const mockHashIsValidUsecase = {
			execute: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CreateLinkUsecase,
				{
					provide: getRepositoryToken(Link),
					useValue: mockLinkRepository,
				},
				{
					provide: HashIsInvalidUsecase,
					useValue: mockHashIsValidUsecase,
				},
			],
		}).compile();

		usecase = module.get<CreateLinkUsecase>(CreateLinkUsecase);
		linkRepository = module.get(getRepositoryToken(Link));
		hashIsValidUsecase = module.get(HashIsInvalidUsecase);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(usecase).toBeDefined();
	});

	describe('execute', () => {
		it('should create a link with a unique hash', async () => {
			nanoid.mockReturnValue('abc123');
			hashIsValidUsecase.execute.mockResolvedValue(false); // Hash is unique
			linkRepository.create.mockReturnValue(mockLink);
			linkRepository.save.mockResolvedValue(mockLink);

			const result = await usecase.execute(mockCreateLinkDto);

			expect(nanoid).toHaveBeenCalledWith(6);
			expect(hashIsValidUsecase.execute).toHaveBeenCalledWith('abc123');
			expect(linkRepository.create).toHaveBeenCalledWith({
				original_url: mockCreateLinkDto.original_url,
				expires_at: mockCreateLinkDto.expires_at,
				user_id: mockCreateLinkDto.user_id,
				current_url: mockCreateLinkDto.original_url,
				hash: 'abc123',
			});
			expect(linkRepository.save).toHaveBeenCalledWith(mockLink);
			expect(result).toEqual(mockLink);
		});

		it('should generate a new hash if the first one is not unique', async () => {
			nanoid
				.mockReturnValueOnce('taken1')
				.mockReturnValueOnce('taken2')
				.mockReturnValueOnce('unique1');

			hashIsValidUsecase.execute
				.mockResolvedValueOnce(true) // First hash exists
				.mockResolvedValueOnce(true) // Second hash exists
				.mockResolvedValueOnce(false); // Third hash is unique

			linkRepository.create.mockReturnValue(mockLink);
			linkRepository.save.mockResolvedValue(mockLink);

			const result = await usecase.execute(mockCreateLinkDto);

			expect(nanoid).toHaveBeenCalledTimes(3);
			expect(hashIsValidUsecase.execute).toHaveBeenCalledTimes(3);
			expect(hashIsValidUsecase.execute).toHaveBeenNthCalledWith(1, 'taken1');
			expect(hashIsValidUsecase.execute).toHaveBeenNthCalledWith(2, 'taken2');
			expect(hashIsValidUsecase.execute).toHaveBeenNthCalledWith(3, 'unique1');
			expect(linkRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					hash: 'unique1',
				}),
			);
			expect(result).toEqual(mockLink);
		});

		it('should create a link without user_id when not provided', async () => {
			const dtoWithoutUserId: CreateLinkDto = {
				original_url: 'https://example.com/test',
			};

			const linkWithoutUser = { ...mockLink, user_id: null };

			nanoid.mockReturnValue('xyz789');
			hashIsValidUsecase.execute.mockResolvedValue(false);
			linkRepository.create.mockReturnValue(linkWithoutUser);
			linkRepository.save.mockResolvedValue(linkWithoutUser);

			const result = await usecase.execute(dtoWithoutUserId);

			expect(linkRepository.create).toHaveBeenCalledWith({
				original_url: dtoWithoutUserId.original_url,
				expires_at: undefined,
				user_id: undefined,
				current_url: dtoWithoutUserId.original_url,
				hash: 'xyz789',
			});
			expect(result.user_id).toBeNull();
		});

		it('should create a link without expiration date when not provided', async () => {
			const dtoWithoutExpiration: CreateLinkDto = {
				original_url: 'https://example.com/test',
				user_id: '123e4567-e89b-12d3-a456-426614174000',
			};

			const linkWithoutExpiration = { ...mockLink, expires_at: null };

			nanoid.mockReturnValue('def456');
			hashIsValidUsecase.execute.mockResolvedValue(false);
			linkRepository.create.mockReturnValue(linkWithoutExpiration);
			linkRepository.save.mockResolvedValue(linkWithoutExpiration);

			const result = await usecase.execute(dtoWithoutExpiration);

			expect(linkRepository.create).toHaveBeenCalledWith({
				original_url: dtoWithoutExpiration.original_url,
				expires_at: undefined,
				user_id: dtoWithoutExpiration.user_id,
				current_url: dtoWithoutExpiration.original_url,
				hash: 'def456',
			});
			expect(result.expires_at).toBeNull();
		});

		it('should set current_url equal to original_url', async () => {
			nanoid.mockReturnValue('ghi789');
			hashIsValidUsecase.execute.mockResolvedValue(false);
			linkRepository.create.mockReturnValue(mockLink);
			linkRepository.save.mockResolvedValue(mockLink);

			await usecase.execute(mockCreateLinkDto);

			expect(linkRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					original_url: mockCreateLinkDto.original_url,
					current_url: mockCreateLinkDto.original_url,
				}),
			);
		});

		it('should generate hash with length of 6 characters', async () => {
			nanoid.mockReturnValue('abc123');
			hashIsValidUsecase.execute.mockResolvedValue(false);
			linkRepository.create.mockReturnValue(mockLink);
			linkRepository.save.mockResolvedValue(mockLink);

			await usecase.execute(mockCreateLinkDto);

			expect(nanoid).toHaveBeenCalledWith(6);
		});
	});
});
