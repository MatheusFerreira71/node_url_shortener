import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
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

		it('should propagate error from service', async () => {
			const res = mockResponse();
			const error = new Error('Service error');

			authService.login.mockRejectedValue(error);

			await expect(controller.login(mockLoginDto, res)).rejects.toThrow(error);

			expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
		});
	});
});
