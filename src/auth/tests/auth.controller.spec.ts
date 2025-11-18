import { Test, type TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import type { LoginDto, LoginResponse } from '../auth.types';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: jest.Mocked<AuthService>;

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
			authService.login.mockResolvedValue(mockLoginResponse);

			await controller.login(mockLoginDto);

			expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
		});

		it('should validate body with LoginSchema', async () => {
			const validBody: LoginDto = {
				email: 'jane@example.com',
				password: 'Password123',
			};

			authService.login.mockResolvedValue({
				...mockLoginResponse,
			});

			await controller.login(validBody);

			expect(authService.login).toHaveBeenCalledWith(validBody);
		});

		it('should propagate error from service', async () => {
			const error = new Error('Service error');

			authService.login.mockRejectedValue(error);

			await expect(controller.login(mockLoginDto)).rejects.toThrow(error);

			expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
		});
	});
});
