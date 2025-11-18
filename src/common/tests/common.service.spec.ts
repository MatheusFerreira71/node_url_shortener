import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { CommonService } from '../common.service';

describe('CommonService', () => {
	let service: CommonService;

	const mockConfigService = {
		get: jest.fn((key: string) => {
			if (key === 'HASH_SECRET_KEY') {
				return 'test-secret-key-with-32-chars!!';
			}
			return null;
		}),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CommonService,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		service = module.get<CommonService>(CommonService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('hash', () => {
		it('should encrypt a string', async () => {
			const input = 'test-string';
			const encrypted = await service.hash(input);

			expect(encrypted).toBeDefined();
			expect(encrypted).not.toBe(input);
		});

		it('should generate different hashes for the same input (due to random IV)', async () => {
			const input = 'test-string';
			const encrypted1 = await service.hash(input);
			const encrypted2 = await service.hash(input);

			expect(encrypted1).not.toBe(encrypted2);
		});
	});

	describe('decodeHash', () => {
		it('should decrypt a string correctly', async () => {
			const input = 'test-string';
			const encrypted = await service.hash(input);
			const decrypted = await service.decodeHash(encrypted);

			expect(decrypted).toBe(input);
		});
	});
});
