// Mock the usecases module to avoid nanoid import issues
jest.mock('../usecases', () => ({
	CreateLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	DeleteLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	ListLinksByUserIdUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	UpdateLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
	AccessLinkUsecase: jest.fn().mockImplementation(() => ({
		execute: jest.fn(),
	})),
}));

import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/guards';
import { SetLoggedUserOnRequestInterceptor } from '../../auth/interceptors';
import type { Env } from '../../types/globals.types';
import { LinkController } from '../link.controller';
import { LinkService } from '../link.service';
import type {
	CreateLinkDto,
	ReturnedLink,
	UpdateLinkResponse,
} from '../link.types';

describe('LinkController', () => {
	let controller: LinkController;
	let linkService: jest.Mocked<LinkService>;
	let configService: jest.Mocked<ConfigService<Env, true>>;

	const mockUser: Express.Request['user'] = {
		id: 'user-123',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [LinkController],
			providers: [
				{
					provide: LinkService,
					useValue: {
						createLink: jest.fn(),
						deleteLink: jest.fn(),
						listLinksByUserId: jest.fn(),
						updateLink: jest.fn(),
						accessLink: jest.fn(),
					},
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn(),
					},
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideInterceptor(SetLoggedUserOnRequestInterceptor)
			.useValue({
				intercept: jest.fn((_context, next) => next.handle()),
			})
			.compile();

		controller = module.get<LinkController>(LinkController);
		linkService = module.get(LinkService);
		configService = module.get(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createLink', () => {
		it('should create a link and return response with short_url', async () => {
			const createDto: Pick<CreateLinkDto, 'expires_at' | 'original_url'> = {
				original_url: 'https://example.com/long-url',
				expires_at: new Date('2025-12-31'),
			};

			const mockCreatedLink = {
				id: 'link-123',
				original_url: createDto.original_url,
				current_url: createDto.original_url,
				hash: 'abc123',
				times_clicked: 0,
				user_id: mockUser?.id ?? null,
				expires_at: createDto.expires_at ?? null,
				user: null,
				created_at: new Date(),
				updated_at: new Date(),
				deleted_at: null,
			};

			linkService.createLink.mockResolvedValue(mockCreatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await controller.createLink(mockUser, createDto);

			expect(linkService.createLink).toHaveBeenCalledWith({
				...createDto,
				user_id: mockUser?.id,
			});
			expect(configService.get).toHaveBeenCalledWith('BASE_URL');
			expect(result).toEqual({
				expires_at: mockCreatedLink.expires_at,
				created_at: mockCreatedLink.created_at,
				current_url: mockCreatedLink.current_url,
				hash: mockCreatedLink.hash,
				user_id: mockCreatedLink.user_id,
				short_url: 'http://localhost:3000/abc123',
			});
		});

		it('should create a link without user when not authenticated', async () => {
			const createDto: Pick<CreateLinkDto, 'expires_at' | 'original_url'> = {
				original_url: 'https://example.com/long-url',
			};

			const mockCreatedLink = {
				id: 'link-123',
				original_url: createDto.original_url,
				current_url: createDto.original_url,
				hash: 'abc123',
				times_clicked: 0,
				user_id: null,
				expires_at: null,
				user: null,
				created_at: new Date(),
				updated_at: new Date(),
				deleted_at: null,
			};

			linkService.createLink.mockResolvedValue(mockCreatedLink);
			configService.get.mockReturnValue('http://localhost:3000');

			const result = await controller.createLink(undefined, createDto);

			expect(linkService.createLink).toHaveBeenCalledWith({
				...createDto,
				user_id: undefined,
			});
			expect(result.user_id).toBeNull();
		});

		it('should propagate error from service', async () => {
			const createDto: Pick<CreateLinkDto, 'expires_at' | 'original_url'> = {
				original_url: 'https://example.com/long-url',
			};

			const error = new Error('Service error');
			linkService.createLink.mockRejectedValue(error);

			await expect(controller.createLink(mockUser, createDto)).rejects.toThrow(
				error,
			);
		});
	});

	describe('deleteLink', () => {
		it('should delete a link', async () => {
			const hash = 'abc123';
			linkService.deleteLink.mockResolvedValue(undefined);

			await controller.deleteLink(mockUser, { hash });

			expect(linkService.deleteLink).toHaveBeenCalledWith({
				hash,
				user_id: mockUser?.id ?? '',
			});
		});

		it('should propagate error from service', async () => {
			const hash = 'abc123';
			const error = new Error('Service error');
			linkService.deleteLink.mockRejectedValue(error);

			await expect(controller.deleteLink(mockUser, { hash })).rejects.toThrow(
				error,
			);
		});
	});

	describe('listLinks', () => {
		it('should list all links for authenticated user', async () => {
			const mockLinks: ReturnedLink[] = [
				{
					current_url: 'https://example.com/page1',
					hash: 'abc123',
					expires_at: new Date('2025-12-31'),
					created_at: new Date(),
					user_id: mockUser.id,
					original_url: 'https://example.com/page1',
					times_clicked: 10,
					updated_at: new Date(),
					short_url: 'http://localhost:3000/abc123',
				},
			];

			linkService.listLinksByUserId.mockResolvedValue(mockLinks);

			const result = await controller.listLinks(mockUser);

			expect(linkService.listLinksByUserId).toHaveBeenCalledWith(
				mockUser?.id ?? '',
			);
			expect(result).toEqual(mockLinks);
		});

		it('should propagate error from service', async () => {
			const error = new Error('Service error');
			linkService.listLinksByUserId.mockRejectedValue(error);

			await expect(controller.listLinks(mockUser)).rejects.toThrow(error);
		});
	});

	describe('updateLink', () => {
		it('should update a link', async () => {
			const hash = 'abc123';
			const current_url = 'https://example.com/updated';

			const mockResponse: UpdateLinkResponse = {
				current_url,
				hash,
				expires_at: new Date('2025-12-31'),
				created_at: new Date(),
				user_id: mockUser?.id ?? null,
				updated_at: new Date(),
				short_url: 'http://localhost:3000/abc123',
			};

			linkService.updateLink.mockResolvedValue(mockResponse);

			const result = await controller.updateLink(
				mockUser,
				{ current_url },
				{ hash },
			);

			expect(linkService.updateLink).toHaveBeenCalledWith({
				hash,
				current_url,
				user_id: mockUser?.id ?? '',
			});
			expect(result).toEqual(mockResponse);
		});

		it('should propagate error from service', async () => {
			const hash = 'abc123';
			const current_url = 'https://example.com/updated';
			const error = new Error('Service error');

			linkService.updateLink.mockRejectedValue(error);

			await expect(
				controller.updateLink(mockUser, { current_url }, { hash }),
			).rejects.toThrow(error);
		});
	});

	describe('accessLink', () => {
		it('should redirect to destination URL', async () => {
			const hash = 'abc123';
			const destination = 'https://example.com/destination';

			const mockResponse = {
				location: jest.fn(),
				redirect: jest.fn(),
			} as unknown as Response;

			linkService.accessLink.mockResolvedValue(destination);

			await controller.accessLink({ hash }, mockResponse);

			expect(linkService.accessLink).toHaveBeenCalledWith(hash);
			expect(mockResponse.location).toHaveBeenCalledWith(destination);
			expect(mockResponse.redirect).toHaveBeenCalledWith(destination);
		});

		it('should propagate error from service', async () => {
			const hash = 'abc123';
			const error = new Error('Service error');
			const mockResponse = {
				location: jest.fn(),
				redirect: jest.fn(),
			} as unknown as Response;

			linkService.accessLink.mockRejectedValue(error);

			await expect(
				controller.accessLink({ hash }, mockResponse),
			).rejects.toThrow(error);
		});
	});
});
