import { Test, type TestingModule } from '@nestjs/testing';
import type { Link } from '../link.entity';
import type {
	CreateLinkDto,
	DeleteLinkUsecasePayload,
	ReturnedLink,
	UpdateLinkResponse,
	UpdateLinkUsecasePayload,
} from '../link.types';

// Mock the usecases module
jest.mock('../usecases', () => ({
	AccessLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	CreateLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	DeleteLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	ListLinksByUserUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	UpdateLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
}));

import { LinkService } from '../link.service';
import {
	AccessLinkUsecase,
	CreateLinkUsecase,
	DeleteLinkUsecase,
	ListLinksByUserUsecase,
	UpdateLinkUsecase,
} from '../usecases';

describe('LinkService', () => {
	let service: LinkService;
	let createLinkUsecase: CreateLinkUsecase;
	let deleteLinkUsecase: DeleteLinkUsecase;
	let listLinksByUserUsecase: ListLinksByUserUsecase;
	let updateLinkUsecase: UpdateLinkUsecase;
	let accessLinkUsecase: AccessLinkUsecase;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LinkService,
				CreateLinkUsecase,
				DeleteLinkUsecase,
				ListLinksByUserUsecase,
				UpdateLinkUsecase,
				AccessLinkUsecase,
			],
		}).compile();

		service = module.get<LinkService>(LinkService);
		createLinkUsecase = module.get(CreateLinkUsecase);
		deleteLinkUsecase = module.get(DeleteLinkUsecase);
		listLinksByUserUsecase = module.get(ListLinksByUserUsecase);
		updateLinkUsecase = module.get(UpdateLinkUsecase);
		accessLinkUsecase = module.get(AccessLinkUsecase);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createLink', () => {
		it('should call CreateLinkUsecase with correct parameters', async () => {
			const mockDto: CreateLinkDto = {
				original_url: 'https://example.com/long-url',
				expires_at: new Date('2025-12-31'),
				user_id: 'user-123',
			};

			const mockLink: Link = {
				id: 'link-id',
				original_url: mockDto.original_url,
				current_url: mockDto.original_url,
				hash: 'abc123',
				times_clicked: 0,
				user_id: mockDto.user_id ?? null,
				expires_at: mockDto.expires_at ?? null,
				user: null,
				created_at: new Date(),
				updated_at: new Date(),
				deleted_at: null,
			};

			jest.spyOn(createLinkUsecase, 'execute').mockResolvedValue(mockLink);

			const result = await service.createLink(mockDto);

			expect(createLinkUsecase.execute).toHaveBeenCalledWith(mockDto);
			expect(result).toEqual(mockLink);
		});

		it('should propagate errors from use case', async () => {
			const mockDto: CreateLinkDto = {
				original_url: 'https://example.com/long-url',
			};

			const error = new Error('Use case error');
			jest.spyOn(createLinkUsecase, 'execute').mockRejectedValue(error);

			await expect(service.createLink(mockDto)).rejects.toThrow(error);
			expect(createLinkUsecase.execute).toHaveBeenCalledWith(mockDto);
		});
	});

	describe('deleteLink', () => {
		it('should call DeleteLinkUsecase with correct parameters', async () => {
			const mockPayload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: 'user-123',
			};

			jest.spyOn(deleteLinkUsecase, 'execute').mockResolvedValue(undefined);

			await service.deleteLink(mockPayload);

			expect(deleteLinkUsecase.execute).toHaveBeenCalledWith(mockPayload);
		});

		it('should propagate errors from use case', async () => {
			const mockPayload: DeleteLinkUsecasePayload = {
				hash: 'abc123',
				user_id: 'user-123',
			};

			const error = new Error('Use case error');
			jest.spyOn(deleteLinkUsecase, 'execute').mockRejectedValue(error);

			await expect(service.deleteLink(mockPayload)).rejects.toThrow(error);
			expect(deleteLinkUsecase.execute).toHaveBeenCalledWith(mockPayload);
		});
	});

	describe('listLinksByUserId', () => {
		it('should call ListLinksByUserUsecase with correct parameters', async () => {
			const userId = 'user-123';
			const mockLinks: ReturnedLink[] = [
				{
					current_url: 'https://example.com/page1',
					hash: 'abc123',
					expires_at: new Date('2025-12-31'),
					created_at: new Date(),
					user_id: userId,
					original_url: 'https://example.com/page1',
					times_clicked: 10,
					updated_at: new Date(),
					short_url: 'http://localhost:3000/abc123',
				},
			];

			jest
				.spyOn(listLinksByUserUsecase, 'execute')
				.mockResolvedValue(mockLinks);

			const result = await service.listLinksByUserId(userId);

			expect(listLinksByUserUsecase.execute).toHaveBeenCalledWith(userId);
			expect(result).toEqual(mockLinks);
		});

		it('should propagate errors from use case', async () => {
			const userId = 'user-123';
			const error = new Error('Use case error');
			jest.spyOn(listLinksByUserUsecase, 'execute').mockRejectedValue(error);

			await expect(service.listLinksByUserId(userId)).rejects.toThrow(error);
			expect(listLinksByUserUsecase.execute).toHaveBeenCalledWith(userId);
		});
	});

	describe('updateLink', () => {
		it('should call UpdateLinkUsecase with correct parameters', async () => {
			const mockPayload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			const mockResponse: UpdateLinkResponse = {
				current_url: mockPayload.current_url,
				hash: mockPayload.hash,
				expires_at: new Date('2025-12-31'),
				created_at: new Date(),
				user_id: mockPayload.user_id,
				updated_at: new Date(),
				short_url: 'http://localhost:3000/abc123',
			};

			jest.spyOn(updateLinkUsecase, 'execute').mockResolvedValue(mockResponse);

			const result = await service.updateLink(mockPayload);

			expect(updateLinkUsecase.execute).toHaveBeenCalledWith(mockPayload);
			expect(result).toEqual(mockResponse);
		});

		it('should propagate errors from use case', async () => {
			const mockPayload: UpdateLinkUsecasePayload = {
				hash: 'abc123',
				current_url: 'https://example.com/updated',
				user_id: 'user-123',
			};

			const error = new Error('Use case error');
			jest.spyOn(updateLinkUsecase, 'execute').mockRejectedValue(error);

			await expect(service.updateLink(mockPayload)).rejects.toThrow(error);
			expect(updateLinkUsecase.execute).toHaveBeenCalledWith(mockPayload);
		});
	});

	describe('accessLink', () => {
		it('should call AccessLinkUsecase with correct parameters', async () => {
			const hash = 'abc123';
			const mockUrl = 'https://example.com/redirect';

			jest.spyOn(accessLinkUsecase, 'execute').mockResolvedValue(mockUrl);

			const result = await service.accessLink(hash);

			expect(accessLinkUsecase.execute).toHaveBeenCalledWith(hash);
			expect(result).toEqual(mockUrl);
		});

		it('should propagate errors from use case', async () => {
			const hash = 'abc123';
			const error = new Error('Use case error');
			jest.spyOn(accessLinkUsecase, 'execute').mockRejectedValue(error);

			await expect(service.accessLink(hash)).rejects.toThrow(error);
			expect(accessLinkUsecase.execute).toHaveBeenCalledWith(hash);
		});
	});
});
