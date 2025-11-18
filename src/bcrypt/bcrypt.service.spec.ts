import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { BcryptService } from './bcrypt.service';

jest.mock('bcrypt');

describe('BcryptService', () => {
	let service: BcryptService;
	let configService: ConfigService;

	const mockConfigService = {
		get: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BcryptService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<BcryptService>(BcryptService);
		configService = module.get<ConfigService>(ConfigService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('hash', () => {
		it('should hash a password with the configured salt rounds', async () => {
			const password = 'myPassword123';
			const saltRounds = 10;
			const hashedPassword = 'hashedPassword';

			mockConfigService.get.mockReturnValue(saltRounds);
			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

			const result = await service.hash(password);

			expect(configService.get).toHaveBeenCalledWith('BCRYPT_SALT_ROUNDS', {
				infer: true,
			});
			expect(bcrypt.hash).toHaveBeenCalledWith(password, saltRounds);
			expect(result).toBe(hashedPassword);
		});

		it('should use different salt rounds when configured', async () => {
			const password = 'anotherPassword';
			const saltRounds = 12;
			const hashedPassword = 'anotherHashedPassword';

			mockConfigService.get.mockReturnValue(saltRounds);
			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

			const result = await service.hash(password);

			expect(bcrypt.hash).toHaveBeenCalledWith(password, saltRounds);
			expect(result).toBe(hashedPassword);
		});
	});

	describe('compare', () => {
		it('should return true when password matches hash', async () => {
			const password = 'myPassword123';
			const hash = 'hashedPassword';

			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			const result = await service.compare(password, hash);

			expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
			expect(result).toBe(true);
		});

		it('should return false when password does not match hash', async () => {
			const password = 'wrongPassword';
			const hash = 'hashedPassword';

			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			const result = await service.compare(password, hash);

			expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
			expect(result).toBe(false);
		});

		it('should handle comparison with different passwords', async () => {
			const correctPassword = 'correctPassword';
			const wrongPassword = 'wrongPassword';
			const hash = 'hashedCorrectPassword';

			(bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
			const correctResult = await service.compare(correctPassword, hash);

			(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
			const wrongResult = await service.compare(wrongPassword, hash);

			expect(correctResult).toBe(true);
			expect(wrongResult).toBe(false);
		});
	});
});
