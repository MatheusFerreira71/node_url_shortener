import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import type { Env } from '../../types/globals.types';
import type { JwtPayload } from '../auth.types';
import { AuthGuard } from '../guards';

describe('AuthGuard', () => {
	let guard: AuthGuard;
	let jwtService: JwtService;
	let configService: ConfigService<Env, true>;

	const mockJwtSecret = 'test-secret-key';
	const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthGuard,
				{
					provide: JwtService,
					useValue: {
						verifyAsync: jest.fn(),
					},
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockReturnValue(mockJwtSecret),
					},
				},
			],
		}).compile();

		guard = module.get<AuthGuard>(AuthGuard);
		jwtService = module.get<JwtService>(JwtService);
		configService = module.get<ConfigService<Env, true>>(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const createMockExecutionContext = (
		authorizationHeader?: string,
	): ExecutionContext => {
		const mockRequest = {
			headers: {
				authorization: authorizationHeader,
			},
			user: undefined,
		} as unknown as Request;

		return {
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest.fn().mockReturnValue(mockRequest),
			}),
		} as unknown as ExecutionContext;
	};

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	describe('canActivate', () => {
		it('should return true and set user in request when token is valid', async () => {
			const mockToken = 'valid.jwt.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const request = context.switchToHttp().getRequest<Request>();

			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
			expect(request.user).toEqual({ id: mockUserId });
			expect(configService.get).toHaveBeenCalledWith('JWT_SECRET_KEY');
		});

		it('should throw UnauthorizedException when no authorization header is provided', async () => {
			const context = createMockExecutionContext();

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(guard.canActivate(context)).rejects.toThrow(
				'Token de autenticação não fornecido.',
			);
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when authorization header is empty', async () => {
			const context = createMockExecutionContext('');

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(guard.canActivate(context)).rejects.toThrow(
				'Token de autenticação não fornecido.',
			);
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when authorization header does not use Bearer scheme', async () => {
			const context = createMockExecutionContext('Basic some-token');

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(guard.canActivate(context)).rejects.toThrow(
				'Token de autenticação não fornecido.',
			);
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when token format is invalid', async () => {
			const context = createMockExecutionContext('Bearer');

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(guard.canActivate(context)).rejects.toThrow(
				'Token de autenticação não fornecido.',
			);
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when token verification fails', async () => {
			const mockToken = 'invalid.jwt.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('Invalid token'));

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(guard.canActivate(context)).rejects.toThrow(
				'Token de autenticação inválido.',
			);
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
		});

		it('should throw UnauthorizedException when token is expired', async () => {
			const mockToken = 'expired.jwt.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('Token expired'));

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(guard.canActivate(context)).rejects.toThrow(
				'Token de autenticação inválido.',
			);
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
		});

		it('should handle multiple spaces in authorization header', async () => {
			const context = createMockExecutionContext('Bearer  ');

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should correctly extract and verify token with valid Bearer format', async () => {
			const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const request = context.switchToHttp().getRequest<Request>();

			const result = await guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.user).toEqual({ id: mockUserId });
			expect(jwtService.verifyAsync).toHaveBeenCalledTimes(1);
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
		});

		it('should throw UnauthorizedException with correct error details when no token provided', async () => {
			const context = createMockExecutionContext();

			try {
				await guard.canActivate(context);
				fail('Should have thrown UnauthorizedException');
			} catch (error) {
				const err = error as UnauthorizedException;
				expect(err).toBeInstanceOf(UnauthorizedException);
				expect(err.message).toBe('Token de autenticação não fornecido.');
				expect(err.getResponse()).toMatchObject({
					message: 'Token de autenticação não fornecido.',
				});
			}
		});

		it('should throw UnauthorizedException with correct error details when token is invalid', async () => {
			const mockToken = 'invalid.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('JWT malformed'));

			try {
				await guard.canActivate(context);
				fail('Should have thrown UnauthorizedException');
			} catch (error) {
				const err = error as UnauthorizedException;
				expect(err).toBeInstanceOf(UnauthorizedException);
				expect(err.message).toBe('Token de autenticação inválido.');
				expect(err.getResponse()).toMatchObject({
					message: 'Token de autenticação inválido.',
				});
			}
		});

		it('should not modify request.user when token verification fails', async () => {
			const mockToken = 'invalid.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const request = context.switchToHttp().getRequest<Request>();

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('Invalid'));

			await expect(guard.canActivate(context)).rejects.toThrow();
			expect(request.user).toBeUndefined();
		});

		it('should handle case-sensitive Bearer scheme', async () => {
			const context = createMockExecutionContext('bearer valid.token');

			await expect(guard.canActivate(context)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should use correct JWT secret from config service', async () => {
			const mockToken = 'valid.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);

			await guard.canActivate(context);

			expect(configService.get).toHaveBeenCalledWith('JWT_SECRET_KEY');
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
		});
	});
});
