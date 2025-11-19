import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import type { LoginDto, LoginResponse } from '../auth.types';
import { LoginUsecase } from '../usecases';

describe('AuthService', () => {
	let service: AuthService;
	let loginUsecase: LoginUsecase;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: LoginUsecase,
					useValue: {
						execute: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		loginUsecase = module.get<LoginUsecase>(LoginUsecase);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('login', () => {
		it('should call the LoginUsecase use case with correct parameters', async () => {
			const mockLoginDto: LoginDto = {
				email: 'john.doe@example.com',
				password: 'SecurePassword123',
			};

			const mockResponse: LoginResponse = {
				access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
				expires_at: new Date('2025-11-17T01:00:00Z'),
			};

			jest.spyOn(loginUsecase, 'execute').mockResolvedValue(mockResponse);

			const result = await service.login(mockLoginDto);

			expect(loginUsecase.execute).toHaveBeenCalledWith(mockLoginDto);
			expect(result).toEqual(mockResponse);
		});

		it('should propagate errors from use case', async () => {
			const mockLoginDto: LoginDto = {
				email: 'john.doe@example.com',
				password: 'SecurePassword123',
			};

			const error = new Error('Use case error');
			jest.spyOn(loginUsecase, 'execute').mockRejectedValue(error);

			await expect(service.login(mockLoginDto)).rejects.toThrow(error);
			expect(loginUsecase.execute).toHaveBeenCalledWith(mockLoginDto);
		});
	});
});
