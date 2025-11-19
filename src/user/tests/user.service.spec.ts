import { Test, type TestingModule } from '@nestjs/testing';
import { CreateUserUsecase, FindByEmailUsecase } from '../usecases';
import type { User } from '../user.entity';
import { UserService } from '../user.service';
import type { CreatedUserResponse, UserCreateDto } from '../user.types';

jest.mock('../usecases');

describe('UserService', () => {
	let service: UserService;
	let createUserUsecase: CreateUserUsecase;
	let findByEmailUsecase: FindByEmailUsecase;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: CreateUserUsecase,
					useValue: {
						execute: jest.fn(),
					},
				},
				{
					provide: FindByEmailUsecase,
					useValue: {
						execute: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<UserService>(UserService);
		createUserUsecase = module.get<CreateUserUsecase>(CreateUserUsecase);
		findByEmailUsecase = module.get<FindByEmailUsecase>(FindByEmailUsecase);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createUser', () => {
		it('should call the CreateUserUsecase use case with correct parameters', async () => {
			const mockUserCreateDto: UserCreateDto = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'SecurePassword123',
			};

			const mockResponse: CreatedUserResponse = {
				id: '123e4567-e89b-12d3-a456-426614174000',
				name: 'John Doe',
				email: 'john.doe@example.com',
				created_at: new Date('2025-11-16T10:00:00Z'),
			};

			jest.spyOn(createUserUsecase, 'execute').mockResolvedValue(mockResponse);

			const result = await service.createUser(mockUserCreateDto);

			expect(createUserUsecase.execute).toHaveBeenCalledWith(mockUserCreateDto);
			expect(result).toEqual(mockResponse);
		});

		it('should propagate errors from use case', async () => {
			const mockUserCreateDto: UserCreateDto = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				password: 'SecurePassword123',
			};

			const error = new Error('Use case error');
			jest.spyOn(createUserUsecase, 'execute').mockRejectedValue(error);

			await expect(service.createUser(mockUserCreateDto)).rejects.toThrow(
				error,
			);
			expect(createUserUsecase.execute).toHaveBeenCalledWith(mockUserCreateDto);
		});
	});

	describe('findByEmail', () => {
		it('should call the FindByEmailUsecase use case with correct parameters', async () => {
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

			jest.spyOn(findByEmailUsecase, 'execute').mockResolvedValue(mockUser);

			const result = await service.findByEmail(mockEmail);

			expect(findByEmailUsecase.execute).toHaveBeenCalledWith(mockEmail);
			expect(result).toEqual(mockUser);
		});

		it('should propagate errors from use case', async () => {
			const mockEmail = 'john.doe@example.com';
			const error = new Error('Use case error');

			jest.spyOn(findByEmailUsecase, 'execute').mockRejectedValue(error);

			await expect(service.findByEmail(mockEmail)).rejects.toThrow(error);
			expect(findByEmailUsecase.execute).toHaveBeenCalledWith(mockEmail);
		});
	});
});
