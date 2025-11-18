import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { BcryptService } from '../../bcrypt/bcrypt.service';
import type { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import type { LoginDto, LoginResponse } from '../auth.types';
import { Login } from '../usecases';

describe('Login', () => {
	let loginUsecase: Login;
	let userService: jest.Mocked<UserService>;
	let bcryptService: jest.Mocked<BcryptService>;
	let jwtService: jest.Mocked<JwtService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				Login,
				{
					provide: UserService,
					useValue: {
						findByEmail: jest.fn(),
					},
				},
				{
					provide: BcryptService,
					useValue: {
						compare: jest.fn(),
					},
				},
				{
					provide: JwtService,
					useValue: {
						signAsync: jest.fn(),
					},
				},
			],
		}).compile();

		loginUsecase = module.get<Login>(Login);
		userService = module.get(UserService);
		bcryptService = module.get(BcryptService);
		jwtService = module.get(JwtService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(loginUsecase).toBeDefined();
	});

	describe('execute', () => {
		const mockLoginDto: LoginDto = {
			email: 'john.doe@example.com',
			password: 'SecurePassword123',
		};

		const mockUser: User = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'hashed_password_123',
			created_at: new Date('2025-11-16T10:00:00Z'),
			updated_at: new Date('2025-11-16T10:00:00Z'),
			deleted_at: null,
		};

		const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

		it('should authenticate user successfully with valid credentials', async () => {
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(true);
			jwtService.signAsync.mockResolvedValue(mockAccessToken);

			const result: LoginResponse = await loginUsecase.execute(mockLoginDto);

			expect(userService.findByEmail).toHaveBeenCalledWith(mockLoginDto.email);
			expect(bcryptService.compare).toHaveBeenCalledWith(
				mockLoginDto.password,
				mockUser.password,
			);
			expect(jwtService.signAsync).toHaveBeenCalledWith({
				sub: mockUser.id,
			});
			expect(result).toHaveProperty('access_token', mockAccessToken);
			expect(result).toHaveProperty('expires_at');
			expect(result.expires_at).toBeInstanceOf(Date);
		});

		it('should throw UnauthorizedException when password is invalid', async () => {
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(false);

			await expect(loginUsecase.execute(mockLoginDto)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(loginUsecase.execute(mockLoginDto)).rejects.toThrow(
				'Credenciais inválidas.',
			);

			expect(userService.findByEmail).toHaveBeenCalledWith(mockLoginDto.email);
			expect(bcryptService.compare).toHaveBeenCalledWith(
				mockLoginDto.password,
				mockUser.password,
			);
			expect(jwtService.signAsync).not.toHaveBeenCalled();
		});

		it('should return JWT token with correct payload structure', async () => {
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(true);
			jwtService.signAsync.mockResolvedValue(mockAccessToken);

			await loginUsecase.execute(mockLoginDto);

			expect(jwtService.signAsync).toHaveBeenCalledWith({
				sub: mockUser.id,
			});
		});

		it('should return expires_at approximately 1 hour from now', async () => {
			const beforeExecution = Date.now();
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(true);
			jwtService.signAsync.mockResolvedValue(mockAccessToken);

			const result = await loginUsecase.execute(mockLoginDto);
			const afterExecution = Date.now();

			const expectedExpiresAt = beforeExecution + 3600 * 1000;
			const actualExpiresAt = result.expires_at.getTime();

			expect(actualExpiresAt).toBeGreaterThanOrEqual(expectedExpiresAt);
			expect(actualExpiresAt).toBeLessThanOrEqual(afterExecution + 3600 * 1000);
		});

		it('should propagate error when userService.findByEmail fails', async () => {
			const error = new Error('User not found');
			userService.findByEmail.mockRejectedValue(error);

			await expect(loginUsecase.execute(mockLoginDto)).rejects.toThrow(error);

			expect(userService.findByEmail).toHaveBeenCalledWith(mockLoginDto.email);
			expect(bcryptService.compare).not.toHaveBeenCalled();
			expect(jwtService.signAsync).not.toHaveBeenCalled();
		});

		it('should propagate error when bcryptService.compare fails', async () => {
			const error = new Error('Compare failed');
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockRejectedValue(error);

			await expect(loginUsecase.execute(mockLoginDto)).rejects.toThrow(error);

			expect(userService.findByEmail).toHaveBeenCalledWith(mockLoginDto.email);
			expect(bcryptService.compare).toHaveBeenCalledWith(
				mockLoginDto.password,
				mockUser.password,
			);
			expect(jwtService.signAsync).not.toHaveBeenCalled();
		});

		it('should propagate error when jwtService.signAsync fails', async () => {
			const error = new Error('JWT signing failed');
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(true);
			jwtService.signAsync.mockRejectedValue(error);

			await expect(loginUsecase.execute(mockLoginDto)).rejects.toThrow(error);

			expect(userService.findByEmail).toHaveBeenCalledWith(mockLoginDto.email);
			expect(bcryptService.compare).toHaveBeenCalledWith(
				mockLoginDto.password,
				mockUser.password,
			);
			expect(jwtService.signAsync).toHaveBeenCalled();
		});

		it('should compare password in correct order (plain, hashed)', async () => {
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(true);
			jwtService.signAsync.mockResolvedValue(mockAccessToken);

			await loginUsecase.execute(mockLoginDto);

			expect(bcryptService.compare).toHaveBeenCalledWith(
				mockLoginDto.password,
				mockUser.password,
			);
		});

		it('should call userService.findByEmail with correct email', async () => {
			userService.findByEmail.mockResolvedValue(mockUser);
			bcryptService.compare.mockResolvedValue(true);
			jwtService.signAsync.mockResolvedValue(mockAccessToken);

			await loginUsecase.execute(mockLoginDto);

			expect(userService.findByEmail).toHaveBeenCalledWith(mockLoginDto.email);
			expect(userService.findByEmail).toHaveBeenCalledTimes(1);
		});
	});
});
