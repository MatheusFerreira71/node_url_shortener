import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { FindByEmailUsecase } from '../usecases';
import { User } from '../user.entity';

describe('FindByEmailUsecase', () => {
	let findByEmail: FindByEmailUsecase;
	let userRepository: jest.Mocked<Repository<User>>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FindByEmailUsecase,
				{
					provide: getRepositoryToken(User),
					useValue: {
						findOne: jest.fn(),
					},
				},
			],
		}).compile();

		findByEmail = module.get<FindByEmailUsecase>(FindByEmailUsecase);
		userRepository = module.get(getRepositoryToken(User));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(findByEmail).toBeDefined();
	});

	describe('execute', () => {
		const mockEmail = 'john.doe@example.com';

		const mockUser: User = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'hashed_password_123',
			created_at: new Date('2025-11-16T10:00:00Z'),
			updated_at: new Date('2025-11-16T10:00:00Z'),
			deleted_at: null,
		};

		it('should find and return user by email successfully', async () => {
			userRepository.findOne.mockResolvedValue(mockUser);

			const result = await findByEmail.execute(mockEmail);

			expect(userRepository.findOne).toHaveBeenCalledWith({
				where: { email: mockEmail },
			});
			expect(result).toEqual(mockUser);
		});

		it('should throw NotFoundException when user is not found', async () => {
			userRepository.findOne.mockResolvedValue(null);

			await expect(findByEmail.execute(mockEmail)).rejects.toThrow(
				NotFoundException,
			);
			await expect(findByEmail.execute(mockEmail)).rejects.toThrow(
				'Usuário não encontrado',
			);

			expect(userRepository.findOne).toHaveBeenCalledWith({
				where: { email: mockEmail },
			});
		});

		it('should call repository with correct email parameter', async () => {
			const testEmail = 'test@example.com';
			userRepository.findOne.mockResolvedValue(mockUser);

			await findByEmail.execute(testEmail);

			expect(userRepository.findOne).toHaveBeenCalledWith({
				where: { email: testEmail },
			});
		});

		it('should return complete user object with all properties', async () => {
			userRepository.findOne.mockResolvedValue(mockUser);

			const result = await findByEmail.execute(mockEmail);

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('name');
			expect(result).toHaveProperty('email');
			expect(result).toHaveProperty('password');
			expect(result).toHaveProperty('created_at');
			expect(result).toHaveProperty('updated_at');
			expect(result).toHaveProperty('deleted_at');
		});

		it('should propagate error when repository fails', async () => {
			const error = new Error('Database connection failed');
			userRepository.findOne.mockRejectedValue(error);

			await expect(findByEmail.execute(mockEmail)).rejects.toThrow(error);

			expect(userRepository.findOne).toHaveBeenCalledWith({
				where: { email: mockEmail },
			});
		});

		it('should handle different email formats', async () => {
			const emails = [
				'test@example.com',
				'test.name@example.co.uk',
				'test+tag@example.com',
			];

			for (const email of emails) {
				userRepository.findOne.mockResolvedValue({ ...mockUser, email });

				const result = await findByEmail.execute(email);

				expect(result.email).toBe(email);
				expect(userRepository.findOne).toHaveBeenCalledWith({
					where: { email },
				});
			}
		});
	});
});
