import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { of } from 'rxjs';
import type { Env } from '../../types/globals.types';
import type { JwtPayload } from '../auth.types';
import { SetLoggedUserOnRequestInterceptor } from '../interceptors';

describe('SetLoggedUserOnRequestInterceptor', () => {
	let interceptor: SetLoggedUserOnRequestInterceptor;
	let jwtService: JwtService;
	let configService: ConfigService<Env, true>;

	const mockJwtSecret = 'test-secret-key';
	const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SetLoggedUserOnRequestInterceptor,
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

		interceptor = module.get<SetLoggedUserOnRequestInterceptor>(
			SetLoggedUserOnRequestInterceptor,
		);
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

	const createMockCallHandler = (): CallHandler<void> => {
		return {
			handle: jest.fn().mockReturnValue(of(undefined)),
		} as unknown as CallHandler<void>;
	};

	it('should be defined', () => {
		expect(interceptor).toBeDefined();
	});

	describe('intercept', () => {
		it('should set user in request when token is valid', async () => {
			const mockToken = 'valid.jwt.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
			expect(request.user).toEqual({ id: mockUserId });
			expect(next.handle).toHaveBeenCalled();
			expect(configService.get).toHaveBeenCalledWith('JWT_SECRET_KEY');
		});

		it('should set user to undefined when no authorization header is provided', async () => {
			const context = createMockExecutionContext();
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
			expect(next.handle).toHaveBeenCalled();
		});

		it('should set user to undefined when authorization header is empty', async () => {
			const context = createMockExecutionContext('');
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
			expect(next.handle).toHaveBeenCalled();
		});

		it('should set user to undefined when authorization header does not use Bearer scheme', async () => {
			const context = createMockExecutionContext('Basic some-token');
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
			expect(next.handle).toHaveBeenCalled();
		});

		it('should set user to undefined when token format is invalid', async () => {
			const context = createMockExecutionContext('Bearer');
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
			expect(next.handle).toHaveBeenCalled();
		});

		it('should set user to undefined when token verification fails', async () => {
			const mockToken = 'invalid.jwt.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('Invalid token'));

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
			expect(next.handle).toHaveBeenCalled();
		});

		it('should set user to undefined when token is expired', async () => {
			const mockToken = 'expired.jwt.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('Token expired'));

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
			expect(next.handle).toHaveBeenCalled();
		});

		it('should continue request flow after setting user', async () => {
			const mockToken = 'valid.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();

			const result = await interceptor.intercept(context, next);

			expect(result).toBeDefined();
			expect(next.handle).toHaveBeenCalledTimes(1);
		});

		it('should continue request flow even when token is invalid', async () => {
			const mockToken = 'invalid.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('Invalid'));

			const result = await interceptor.intercept(context, next);

			expect(result).toBeDefined();
			expect(next.handle).toHaveBeenCalledTimes(1);
		});

		it('should continue request flow when no token is provided', async () => {
			const context = createMockExecutionContext();
			const next = createMockCallHandler();

			const result = await interceptor.intercept(context, next);

			expect(result).toBeDefined();
			expect(next.handle).toHaveBeenCalledTimes(1);
		});

		it('should handle multiple spaces in authorization header', async () => {
			const context = createMockExecutionContext('Bearer  ');
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
			expect(next.handle).toHaveBeenCalled();
		});

		it('should correctly extract and verify token with valid Bearer format', async () => {
			const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toEqual({ id: mockUserId });
			expect(jwtService.verifyAsync).toHaveBeenCalledTimes(1);
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
			expect(next.handle).toHaveBeenCalled();
		});

		it('should handle case-sensitive Bearer scheme', async () => {
			const context = createMockExecutionContext('bearer valid.token');
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toBeUndefined();
			expect(jwtService.verifyAsync).not.toHaveBeenCalled();
			expect(next.handle).toHaveBeenCalled();
		});

		it('should use correct JWT secret from config service', async () => {
			const mockToken = 'valid.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();

			await interceptor.intercept(context, next);

			expect(configService.get).toHaveBeenCalledWith('JWT_SECRET_KEY');
			expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
				secret: mockJwtSecret,
			});
		});

		it('should not throw exceptions on any scenario', async () => {
			const scenarios = [
				createMockExecutionContext(),
				createMockExecutionContext(''),
				createMockExecutionContext('Bearer'),
				createMockExecutionContext('Basic token'),
				createMockExecutionContext('bearer token'),
			];

			for (const context of scenarios) {
				const next = createMockCallHandler();
				await expect(
					interceptor.intercept(context, next),
				).resolves.toBeDefined();
			}
		});

		it('should not throw exceptions when JWT verification fails', async () => {
			const mockToken = 'invalid.token';
			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();

			jest
				.spyOn(jwtService, 'verifyAsync')
				.mockRejectedValue(new Error('JWT error'));

			await expect(interceptor.intercept(context, next)).resolves.toBeDefined();
		});

		it('should return observable from next.handle()', async () => {
			const context = createMockExecutionContext();
			const next = createMockCallHandler();

			const result = await interceptor.intercept(context, next);

			expect(result).toBe(next.handle());
		});

		it('should handle JWT payload with different user IDs', async () => {
			const mockToken = 'valid.token';
			const differentUserId = '987e6543-e21b-12d3-a456-426614174999';
			const mockPayload: JwtPayload = {
				sub: differentUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const context = createMockExecutionContext(`Bearer ${mockToken}`);
			const next = createMockCallHandler();
			const request = context.switchToHttp().getRequest<Request>();

			await interceptor.intercept(context, next);

			expect(request.user).toEqual({ id: differentUserId });
			expect(request.user?.id).toBe(differentUserId);
		});

		it('should overwrite existing user in request when token is valid', async () => {
			const mockToken = 'valid.token';
			const mockPayload: JwtPayload = {
				sub: mockUserId,
			};

			jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

			const mockRequest = {
				headers: {
					authorization: `Bearer ${mockToken}`,
				},
				user: { id: 'old-user-id' },
			} as unknown as Request;

			const context = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			const next = createMockCallHandler();

			await interceptor.intercept(context, next);

			expect(mockRequest.user).toEqual({ id: mockUserId });
			expect(mockRequest.user?.id).not.toBe('old-user-id');
		});

		it('should overwrite existing user to undefined when no token provided', async () => {
			const mockRequest = {
				headers: {},
				user: { id: 'existing-user-id' },
			} as unknown as Request;

			const context = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: jest.fn().mockReturnValue(mockRequest),
				}),
			} as unknown as ExecutionContext;

			const next = createMockCallHandler();

			await interceptor.intercept(context, next);

			expect(mockRequest.user).toBeUndefined();
		});
	});
});
