import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Link } from '../link.entity';
import { HashIsInvalidUsecase } from '../usecases/hash-is-invalid.usecase';

describe('HashIsInvalidUsecase', () => {
	let usecase: HashIsInvalidUsecase;
	let linkRepository: jest.Mocked<Repository<Link>>;

	const mockLink: Link = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		original_url: 'https://example.com/original',
		current_url: 'https://example.com/current',
		hash: 'abc123',
		times_clicked: 5,
		user_id: 'user-123',
		expires_at: new Date(Date.now() + 86400000),
		user: null,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: null,
	};

	beforeEach(async () => {
		const mockLinkRepository = {
			findOne: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				HashIsInvalidUsecase,
				{
					provide: getRepositoryToken(Link),
					useValue: mockLinkRepository,
				},
			],
		}).compile();

		usecase = module.get<HashIsInvalidUsecase>(HashIsInvalidUsecase);
		linkRepository = module.get(getRepositoryToken(Link));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(usecase).toBeDefined();
	});

	describe('execute', () => {
		it('should return true when hash exists in database', async () => {
			linkRepository.findOne.mockResolvedValue(mockLink);

			const result = await usecase.execute('abc123');

			expect(result).toBe(true);
			expect(linkRepository.findOne).toHaveBeenCalledWith({
				where: { hash: 'abc123' },
			});
			expect(linkRepository.findOne).toHaveBeenCalledTimes(1);
		});

		it('should return false when hash does not exist in database', async () => {
			linkRepository.findOne.mockResolvedValue(null);

			const result = await usecase.execute('nonexistent');

			expect(result).toBe(false);
			expect(linkRepository.findOne).toHaveBeenCalledWith({
				where: { hash: 'nonexistent' },
			});
			expect(linkRepository.findOne).toHaveBeenCalledTimes(1);
		});

		it('should correctly convert truthy link to boolean true', async () => {
			linkRepository.findOne.mockResolvedValue(mockLink);

			const result = await usecase.execute('abc123');

			expect(result).toBe(true);
			expect(typeof result).toBe('boolean');
		});

		it('should correctly convert null to boolean false', async () => {
			linkRepository.findOne.mockResolvedValue(null);

			const result = await usecase.execute('xyz789');

			expect(result).toBe(false);
			expect(typeof result).toBe('boolean');
		});

		it('should handle different hash formats', async () => {
			const testCases = [
				{ hash: 'abc123', exists: true },
				{ hash: 'XYZ789', exists: true },
				{ hash: '123456', exists: false },
				{ hash: 'a1b2c3', exists: false },
			];

			for (const testCase of testCases) {
				linkRepository.findOne.mockResolvedValue(
					testCase.exists ? mockLink : null,
				);

				const result = await usecase.execute(testCase.hash);

				expect(result).toBe(testCase.exists);
				expect(linkRepository.findOne).toHaveBeenCalledWith({
					where: { hash: testCase.hash },
				});
			}
		});

		it('should use findOne method with correct parameters', async () => {
			linkRepository.findOne.mockResolvedValue(mockLink);

			await usecase.execute('test123');

			expect(linkRepository.findOne).toHaveBeenCalledWith({
				where: { hash: 'test123' },
			});
		});
	});
});
