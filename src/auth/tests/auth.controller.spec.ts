import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import type { LoginDto, LoginResponse } from '../auth.types';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: jest.Mocked<AuthService>;

	const mockResponse = () => {
		const res: Partial<Response> = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};
		return res as Response;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: {
						login: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get(AuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('login', () => {
		const mockLoginDto: LoginDto = {
			email: 'john.doe@example.com',
			password: 'SecurePassword123',
		};

		const mockLoginResponse: LoginResponse = {
			access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
			expires_at: new Date('2025-11-17T01:00:00Z'),
		};

		it('should login successfully and return access token', async () => {
			const res = mockResponse();

			authService.login.mockResolvedValue(mockLoginResponse);

			await controller.login(mockLoginDto, res);

			expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
			expect(res.json).toHaveBeenCalledWith(mockLoginResponse);
		});

		it('should validate body with LoginSchema', async () => {
			const res = mockResponse();
			const validBody: LoginDto = {
				email: 'jane@example.com',
				password: 'Password123',
			};

			authService.login.mockResolvedValue({
				...mockLoginResponse,
			});

			await controller.login(validBody, res);

			expect(authService.login).toHaveBeenCalledWith(validBody);
		});

		it('should throw validation error when email is invalid', async () => {
			const res = mockResponse();
			const invalidBody = {
				email: 'invalid-email',
				password: 'SecurePassword123',
			};

			await expect(
				controller.login(invalidBody as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should throw validation error when email is missing', async () => {
			const res = mockResponse();
			const invalidBody = {
				password: 'SecurePassword123',
			};

			await expect(
				controller.login(invalidBody as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should throw validation error when password is missing', async () => {
			const res = mockResponse();
			const invalidBody = {
				email: 'john@example.com',
			};

			await expect(
				controller.login(invalidBody as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should throw validation error when password is too short', async () => {
			const res = mockResponse();
			const invalidBody = {
				email: 'john@example.com',
				password: '123',
			};

			await expect(
				controller.login(invalidBody as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should throw validation error when password is too long', async () => {
			const res = mockResponse();
			const invalidBody = {
				email: 'john@example.com',
				password: 'a'.repeat(51),
			};

			await expect(
				controller.login(invalidBody as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should throw validation error when email is too long', async () => {
			const res = mockResponse();
			const invalidBody = {
				email: `${'a'.repeat(140)}@example.com`,
				password: 'password123',
			};

			await expect(
				controller.login(invalidBody as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should reject email with leading/trailing spaces', async () => {
			const res = mockResponse();
			const bodyWithSpaces = {
				email: '  john@example.com  ',
				password: 'password123',
			};

			await expect(
				controller.login(bodyWithSpaces as LoginDto, res),
			).rejects.toThrow(ZodError);

			expect(authService.login).not.toHaveBeenCalled();
		});

		it('should propagate error from service', async () => {
			const res = mockResponse();
			const error = new Error('Service error');

			authService.login.mockRejectedValue(error);

			await expect(controller.login(mockLoginDto, res)).rejects.toThrow(error);

			expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
		});
	});
});
