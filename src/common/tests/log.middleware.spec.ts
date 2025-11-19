import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { LogMiddleware } from '../middlewares/log.middleware';

describe('LogMiddleware', () => {
	let middleware: LogMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let logSpy: jest.SpyInstance;

	beforeEach(() => {
		middleware = new LogMiddleware();

		mockRequest = {
			method: 'GET',
			originalUrl: '/test',
			ip: '127.0.0.1',
			get: jest.fn((header: string) => {
				if (header === 'user-agent') return 'test-agent';
				return '';
			}) as unknown as Request['get'],
		};

		const listeners: { [event: string]: (() => void)[] } = {};
		mockResponse = {
			statusCode: 200,
			on: jest.fn((event: string, callback: () => void) => {
				listeners[event] = listeners[event] || [];
				listeners[event].push(callback);
				return mockResponse as Response;
			}),
			emit: jest.fn((event: string) => {
				if (listeners[event]) {
					for (const callback of listeners[event]) {
						callback();
					}
				}
				return true;
			}),
		};

		mockNext = jest.fn();

		logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(middleware).toBeDefined();
	});

	it('should log incoming request with method, url, ip and user-agent', () => {
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		expect(logSpy).toHaveBeenCalledWith('→ GET /test - 127.0.0.1 - test-agent');
	});

	it('should call next function', () => {
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
	});

	it('should log response with success emoji for 2xx status', () => {
		jest.useFakeTimers();

		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		jest.advanceTimersByTime(50);
		mockResponse.statusCode = 200;
		(mockResponse.emit as jest.Mock)('finish');

		expect(logSpy).toHaveBeenCalledWith('✅ GET /test 200 - 50ms');

		jest.useRealTimers();
	});

	it('should log response with redirect emoji for 3xx status', () => {
		jest.useFakeTimers();

		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		jest.advanceTimersByTime(25);
		mockResponse.statusCode = 301;
		(mockResponse.emit as jest.Mock)('finish');

		expect(logSpy).toHaveBeenCalledWith('↩️ GET /test 301 - 25ms');

		jest.useRealTimers();
	});

	it('should log response with error emoji for 4xx status', () => {
		jest.useFakeTimers();

		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		jest.advanceTimersByTime(30);
		mockResponse.statusCode = 404;
		(mockResponse.emit as jest.Mock)('finish');

		expect(logSpy).toHaveBeenCalledWith('❌ GET /test 404 - 30ms');

		jest.useRealTimers();
	});

	it('should log response with error emoji for 5xx status', () => {
		jest.useFakeTimers();

		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		jest.advanceTimersByTime(100);
		mockResponse.statusCode = 500;
		(mockResponse.emit as jest.Mock)('finish');

		expect(logSpy).toHaveBeenCalledWith('❌ GET /test 500 - 100ms');

		jest.useRealTimers();
	});

	it('should handle missing user-agent', () => {
		mockRequest.get = jest.fn(() => '') as unknown as Request['get'];

		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		expect(logSpy).toHaveBeenCalledWith('→ GET /test - 127.0.0.1 - ');
	});

	it('should calculate response time correctly', () => {
		jest.useFakeTimers();

		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		// Simula 150ms de processamento
		jest.advanceTimersByTime(150);
		mockResponse.statusCode = 201;
		(mockResponse.emit as jest.Mock)('finish');

		expect(logSpy).toHaveBeenCalledWith('✅ GET /test 201 - 150ms');

		jest.useRealTimers();
	});

	it('should work with different HTTP methods', () => {
		const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

		methods.forEach((method) => {
			jest.clearAllMocks();
			mockRequest.method = method;

			middleware.use(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining(`→ ${method} /test`),
			);
		});
	});

	it('should register finish event listener on response', () => {
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		expect(mockResponse.on).toHaveBeenCalledWith(
			'finish',
			expect.any(Function),
		);
	});
});
