import { type ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError, z } from 'zod';
import { ZodExceptionFilter } from '../filters/zod-exception.filter';

describe('ZodExceptionFilter', () => {
	let filter: ZodExceptionFilter;
	let mockResponse: Partial<Response>;
	let mockArgumentsHost: ArgumentsHost;

	beforeEach(() => {
		filter = new ZodExceptionFilter();

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};

		mockArgumentsHost = {
			switchToHttp: jest.fn().mockReturnValue({
				getResponse: jest.fn().mockReturnValue(mockResponse),
			}),
		} as unknown as ArgumentsHost;
	});

	it('should be defined', () => {
		expect(filter).toBeDefined();
	});

	it('should catch ZodError and return formatted response', () => {
		const schema = z.object({
			email: z.email(),
			age: z.number().min(18),
		});

		try {
			schema.parse({ email: 'invalid-email', age: 15 });
		} catch (error) {
			if (error instanceof ZodError) {
				filter.catch(error, mockArgumentsHost);

				expect(mockResponse.status).toHaveBeenCalledWith(
					HttpStatus.BAD_REQUEST,
				);
				expect(mockResponse.json).toHaveBeenCalledWith({
					statusCode: HttpStatus.BAD_REQUEST,
					message: 'Validação falhou',
					errors: expect.any(Object),
				});
			}
		}
	});

	it('should return structured errors using treeifyError', () => {
		const schema = z.object({
			name: z.string().min(3),
			email: z.email(),
		});

		try {
			schema.parse({ name: 'ab', email: 'not-an-email' });
		} catch (error) {
			if (error instanceof ZodError) {
				filter.catch(error, mockArgumentsHost);

				const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
				expect(callArgs.errors).toBeDefined();
				expect(typeof callArgs.errors).toBe('object');
			}
		}
	});

	it('should handle multiple validation errors', () => {
		const schema = z.object({
			username: z.string().min(3),
			password: z.string().min(8),
			age: z.number().positive(),
		});

		try {
			schema.parse({ username: 'ab', password: '123', age: -5 });
		} catch (error) {
			if (error instanceof ZodError) {
				filter.catch(error, mockArgumentsHost);

				expect(mockResponse.status).toHaveBeenCalledWith(
					HttpStatus.BAD_REQUEST,
				);
				expect(mockResponse.json).toHaveBeenCalled();

				const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
				expect(callArgs.statusCode).toBe(HttpStatus.BAD_REQUEST);
				expect(callArgs.message).toBe('Validação falhou');
				expect(callArgs.errors).toBeDefined();
			}
		}
	});

	it('should call switchToHttp from ArgumentsHost', () => {
		const schema = z.object({
			field: z.string(),
		});

		try {
			schema.parse({ field: 123 });
		} catch (error) {
			if (error instanceof ZodError) {
				filter.catch(error, mockArgumentsHost);

				expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
			}
		}
	});

	it('should return the response object after processing', () => {
		const schema = z.object({
			test: z.string(),
		});

		try {
			schema.parse({ test: 123 });
		} catch (error) {
			if (error instanceof ZodError) {
				const result = filter.catch(error, mockArgumentsHost);

				expect(result).toBe(mockResponse);
			}
		}
	});

	it('should handle array validation errors', () => {
		const schema = z.object({
			items: z.array(z.string()).min(1),
		});

		try {
			schema.parse({ items: [] });
		} catch (error) {
			if (error instanceof ZodError) {
				filter.catch(error, mockArgumentsHost);

				expect(mockResponse.status).toHaveBeenCalledWith(
					HttpStatus.BAD_REQUEST,
				);
				expect(mockResponse.json).toHaveBeenCalled();
			}
		}
	});

	it('should handle nested validation errors', () => {
		const schema = z.object({
			user: z.object({
				profile: z.object({
					name: z.string().min(3),
				}),
			}),
		});

		try {
			schema.parse({ user: { profile: { name: 'ab' } } });
		} catch (error) {
			if (error instanceof ZodError) {
				filter.catch(error, mockArgumentsHost);

				const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
				expect(callArgs.errors).toBeDefined();
				expect(mockResponse.status).toHaveBeenCalledWith(
					HttpStatus.BAD_REQUEST,
				);
			}
		}
	});
});
