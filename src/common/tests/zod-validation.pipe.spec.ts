import type { ArgumentMetadata } from '@nestjs/common';
import { ZodError, z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

describe('ZodValidationPipe', () => {
	let pipe: ZodValidationPipe;

	const testSchema = z.object({
		email: z.email(),
		name: z.string().min(3),
		age: z.number().positive(),
	});

	const metadata: ArgumentMetadata = {
		type: 'body',
		metatype: Object,
		data: '',
	};

	beforeEach(() => {
		pipe = new ZodValidationPipe(testSchema);
	});

	it('should be defined', () => {
		expect(pipe).toBeDefined();
	});

	it('should validate and return parsed data when input is valid', () => {
		const validInput = {
			email: 'test@example.com',
			name: 'John',
			age: 25,
		};

		const result = pipe.transform(validInput, metadata);

		expect(result).toEqual(validInput);
	});

	it('should throw ZodError when validation fails', () => {
		const invalidInput = {
			email: 'invalid-email',
			name: 'ab',
			age: -5,
		};

		expect(() => pipe.transform(invalidInput, metadata)).toThrow(ZodError);
	});

	it('should throw ZodError for missing required fields', () => {
		const incompleteInput = {
			email: 'test@example.com',
		};

		expect(() => pipe.transform(incompleteInput, metadata)).toThrow(ZodError);
	});

	it('should validate string schemas correctly', () => {
		const stringSchema = z.string().min(5);
		const stringPipe = new ZodValidationPipe(stringSchema);

		const validString = 'hello world';
		const result = stringPipe.transform(validString, metadata);

		expect(result).toBe(validString);
	});

	it('should throw ZodError for invalid string schema', () => {
		const stringSchema = z.string().min(5);
		const stringPipe = new ZodValidationPipe(stringSchema);

		expect(() => stringPipe.transform('hi', metadata)).toThrow(ZodError);
	});

	it('should validate number schemas correctly', () => {
		const numberSchema = z.number().min(10).max(100);
		const numberPipe = new ZodValidationPipe(numberSchema);

		const result = numberPipe.transform(50, metadata);

		expect(result).toBe(50);
	});

	it('should throw ZodError for invalid number', () => {
		const numberSchema = z.number().min(10);
		const numberPipe = new ZodValidationPipe(numberSchema);

		expect(() => numberPipe.transform(5, metadata)).toThrow(ZodError);
	});

	it('should validate array schemas correctly', () => {
		const arraySchema = z.array(z.string()).min(1);
		const arrayPipe = new ZodValidationPipe(arraySchema);

		const validArray = ['item1', 'item2'];
		const result = arrayPipe.transform(validArray, metadata);

		expect(result).toEqual(validArray);
	});

	it('should throw ZodError for invalid array', () => {
		const arraySchema = z.array(z.string()).min(1);
		const arrayPipe = new ZodValidationPipe(arraySchema);

		expect(() => arrayPipe.transform([], metadata)).toThrow(ZodError);
	});

	it('should validate nested object schemas', () => {
		const nestedSchema = z.object({
			user: z.object({
				profile: z.object({
					name: z.string().min(3),
					email: z.string().email(),
				}),
			}),
		});
		const nestedPipe = new ZodValidationPipe(nestedSchema);

		const validNested = {
			user: {
				profile: {
					name: 'John Doe',
					email: 'john@example.com',
				},
			},
		};

		const result = nestedPipe.transform(validNested, metadata);

		expect(result).toEqual(validNested);
	});

	it('should throw ZodError for invalid nested object', () => {
		const nestedSchema = z.object({
			user: z.object({
				profile: z.object({
					name: z.string().min(3),
				}),
			}),
		});
		const nestedPipe = new ZodValidationPipe(nestedSchema);

		const invalidNested = {
			user: {
				profile: {
					name: 'ab',
				},
			},
		};

		expect(() => nestedPipe.transform(invalidNested, metadata)).toThrow(
			ZodError,
		);
	});

	it('should handle optional fields correctly', () => {
		const optionalSchema = z.object({
			name: z.string(),
			age: z.number().optional(),
		});
		const optionalPipe = new ZodValidationPipe(optionalSchema);

		const inputWithoutOptional = {
			name: 'John',
		};

		const result = optionalPipe.transform(inputWithoutOptional, metadata);

		expect(result).toEqual(inputWithoutOptional);
	});

	it('should validate and parse dates correctly', () => {
		const dateSchema = z.object({
			birthDate: z.string().datetime(),
		});
		const datePipe = new ZodValidationPipe(dateSchema);

		const validDate = {
			birthDate: '2024-01-15T10:30:00Z',
		};

		const result = datePipe.transform(validDate, metadata);

		expect(result).toEqual(validDate);
	});

	it('should throw ZodError for invalid date format', () => {
		const dateSchema = z.object({
			birthDate: z.string().datetime(),
		});
		const datePipe = new ZodValidationPipe(dateSchema);

		const invalidDate = {
			birthDate: 'not-a-date',
		};

		expect(() => datePipe.transform(invalidDate, metadata)).toThrow(ZodError);
	});

	it('should validate enum values correctly', () => {
		const enumSchema = z.object({
			role: z.enum(['admin', 'user', 'guest']),
		});
		const enumPipe = new ZodValidationPipe(enumSchema);

		const validEnum = {
			role: 'admin',
		};

		const result = enumPipe.transform(validEnum, metadata);

		expect(result).toEqual(validEnum);
	});

	it('should throw ZodError for invalid enum value', () => {
		const enumSchema = z.object({
			role: z.enum(['admin', 'user', 'guest']),
		});
		const enumPipe = new ZodValidationPipe(enumSchema);

		const invalidEnum = {
			role: 'superuser',
		};

		expect(() => enumPipe.transform(invalidEnum, metadata)).toThrow(ZodError);
	});
});
