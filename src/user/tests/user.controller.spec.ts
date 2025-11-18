import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import type { CreatedUserResponse, UserCreateDto } from '../user.types';

describe('UserController', () => {
	let controller: UserController;
	let userService: jest.Mocked<UserService>;

	const mockResponse = () => {
		const res: Partial<Response> = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};
		return res as Response;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: {
						createUser: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<UserController>(UserController);
		userService = module.get(UserService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createUser', () => {
		const mockUserCreateDto: UserCreateDto = {
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'SecurePassword123',
		};

		const mockCreatedUserResponse: CreatedUserResponse = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'John Doe',
			email: 'john.doe@example.com',
			created_at: new Date('2025-11-16T10:00:00Z'),
		};

		it('should create a user successfully and return the correct response', async () => {
			const res = mockResponse();

			userService.createUser.mockResolvedValue(mockCreatedUserResponse);

			await controller.createUser(mockUserCreateDto, res);

			expect(userService.createUser).toHaveBeenCalledWith(mockUserCreateDto);
			expect(res.json).toHaveBeenCalledWith(mockCreatedUserResponse);
		});

		it('should validate body with UserCreateSchema', async () => {
			const res = mockResponse();
			const validBody = {
				name: 'Jane Doe',
				email: 'jane@example.com',
				password: 'Password123',
			};

			userService.createUser.mockResolvedValue({
				...mockCreatedUserResponse,
				name: 'Jane Doe',
				email: 'jane@example.com',
			});

			await controller.createUser(validBody, res);

			expect(userService.createUser).toHaveBeenCalledWith(validBody);
		});

		it('should throw validation error when email is invalid', async () => {
			const res = mockResponse();
			const invalidBody = {
				name: 'John Doe',
				email: 'invalid-email',
				password: 'SecurePassword123',
			};

			await expect(controller.createUser(invalidBody, res)).rejects.toThrow(
				ZodError,
			);

			expect(userService.createUser).not.toHaveBeenCalled();
		});

		it('should throw validation error when password is too short', async () => {
			const res = mockResponse();
			const invalidBody = {
				name: 'John Doe',
				email: 'john@example.com',
				password: '123',
			};

			await expect(controller.createUser(invalidBody, res)).rejects.toThrow(
				ZodError,
			);

			expect(userService.createUser).not.toHaveBeenCalled();
		});

		it('should throw validation error when email is missing', async () => {
			const res = mockResponse();
			const invalidBody = {
				name: 'John Doe',
				password: 'SecurePassword123',
			};

			await expect(
				controller.createUser(invalidBody as UserCreateDto, res),
			).rejects.toThrow(ZodError);

			expect(userService.createUser).not.toHaveBeenCalled();
		});

		it('should throw validation error when password is missing', async () => {
			const res = mockResponse();
			const invalidBody = {
				name: 'John Doe',
				email: 'john@example.com',
			};

			await expect(
				controller.createUser(invalidBody as UserCreateDto, res),
			).rejects.toThrow(ZodError);

			expect(userService.createUser).not.toHaveBeenCalled();
		});

		it('should accept body without name (optional field)', async () => {
			const res = mockResponse();
			const validBodyWithoutName = {
				email: 'john@example.com',
				password: 'SecurePassword123',
			};

			userService.createUser.mockResolvedValue({
				...mockCreatedUserResponse,
				name: undefined as unknown as string,
			});

			await controller.createUser(validBodyWithoutName, res);

			expect(userService.createUser).toHaveBeenCalledWith(validBodyWithoutName);
			expect(res.json).toHaveBeenCalled();
		});

		it('should throw validation error when email exceeds 150 characters', async () => {
			const res = mockResponse();
			const longEmail = `${'a'.repeat(140)}@example.com`;
			const invalidBody = {
				name: 'John Doe',
				email: longEmail,
				password: 'SecurePassword123',
			};

			await expect(controller.createUser(invalidBody, res)).rejects.toThrow(
				ZodError,
			);

			expect(userService.createUser).not.toHaveBeenCalled();
		});

		it('should throw validation error when password exceeds 50 characters', async () => {
			const res = mockResponse();
			const invalidBody = {
				name: 'John Doe',
				email: 'john@example.com',
				password: 'a'.repeat(51),
			};

			await expect(controller.createUser(invalidBody, res)).rejects.toThrow(
				ZodError,
			);

			expect(userService.createUser).not.toHaveBeenCalled();
		});

		it('should propagate error from service', async () => {
			const res = mockResponse();
			const error = new Error('Service error');

			userService.createUser.mockRejectedValue(error);

			await expect(
				controller.createUser(mockUserCreateDto, res),
			).rejects.toThrow(error);

			expect(userService.createUser).toHaveBeenCalledWith(mockUserCreateDto);
		});
	});
});
