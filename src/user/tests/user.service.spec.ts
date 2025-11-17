import { Test, type TestingModule } from '@nestjs/testing';
import { CreateUser } from '../usecases';
import { UserService } from '../user.service';
import type { CreatedUserResponse, UserCreateDto } from '../user.types';

jest.mock('../usecases');

describe('UserService', () => {
	let service: UserService;
	let createUserUsecase: CreateUser;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: CreateUser,
					useValue: {
						execute: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<UserService>(UserService);
		createUserUsecase = module.get<CreateUser>(CreateUser);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createUser', () => {
		it('should call the CreateUser use case with correct parameters', async () => {
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
});
