import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Link } from '../link.entity';
import type { DeleteLinkUsecasePayload } from '../link.types';
import { DeleteLinkUsecase } from '../usecases/delete-link.usecase';

describe('DeleteLinkUsecase', () => {
	let usecase: DeleteLinkUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;

	const mockLink: Link = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		original_url: 'https://example.com/original',
		current_url: 'https://example.com/current',
		hash: 'abc123',
		times_clicked: 5,
		user_id: 'user-123',
		expires_at: new Date(Date.now() + 86400000),
		user: null,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};

	beforeEach(async () => {
		const mockLinkRepository = {
			findOneBy: jest.fn(),
			softDelete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeleteLinkUsecase,
				{
					provide: getRepositoryToken(Link),
					useValue: mockLinkRepository,
				},
			],
		}).compile();

		usecase = module.get<DeleteLinkUsecase>(DeleteLinkUsecase);
		linkRepository = module.get(getRepositoryToken(Link));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(usecase).toBeDefined();
	});

	describe('execute', () => {
		it('should successfully delete a link when user owns it', async () => {
			const payload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: 'user-123',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.softDelete.mockResolvedValue({
				affected: 1,
				raw: {},
				generatedMaps: [],
			});

			await usecase.execute(payload);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.softDelete).toHaveBeenCalledWith({
				hash: 'abc123',
			});
			expect(linkRepository.softDelete).toHaveBeenCalledTimes(1);
		});

		it('should throw NotFoundException when link does not exist', async () => {
			const payload: DeleteLinkUsecasePayload = {
				hash: 'nonexistent',
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
			expect(linkRepository.softDelete).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when user does not own the link', async () => {
			const payload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
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
			expect(linkRepository.softDelete).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when user_id is not provided', async () => {
			const payload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: '',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);

			await expect(usecase.execute(payload)).rejects.toThrow(
				ForbiddenException,
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.softDelete).not.toHaveBeenCalled();
		});

		it('should throw ForbiddenException when link has no owner', async () => {
			const linkWithoutOwner: Link = {
				...mockLink,
				user_id: null,
			};

			const payload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: 'user-123',
			};

			linkRepository.findOneBy.mockResolvedValue(linkWithoutOwner);

			await expect(usecase.execute(payload)).rejects.toThrow(
				ForbiddenException,
			);

			expect(linkRepository.findOneBy).toHaveBeenCalledWith({ hash: 'abc123' });
			expect(linkRepository.softDelete).not.toHaveBeenCalled();
		});

		it('should perform soft delete instead of hard delete', async () => {
			const payload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: 'user-123',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.softDelete.mockResolvedValue({
				affected: 1,
				raw: {},
				generatedMaps: [],
			});

			await usecase.execute(payload);

			expect(linkRepository.softDelete).toHaveBeenCalledWith({
				hash: 'abc123',
			});
			expect(linkRepository.softDelete).toHaveBeenCalledTimes(1);
		});

		it('should not return any value after successful deletion', async () => {
			const payload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: 'user-123',
			};

			linkRepository.findOneBy.mockResolvedValue(mockLink);
			linkRepository.softDelete.mockResolvedValue({
				affected: 1,
				raw: {},
				generatedMaps: [],
			});

			const result = await usecase.execute(payload);

			expect(result).toBeUndefined();
		});
	});
});
