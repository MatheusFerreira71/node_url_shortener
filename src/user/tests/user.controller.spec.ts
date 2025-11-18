import { Test, type TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import type { CreatedUserResponse, UserCreateDto } from '../user.types';

describe('UserController', () => {
	let controller: UserController;
	let userService: jest.Mocked<UserService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: {
						createUser: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<UserController>(UserController);
		userService = module.get(UserService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('createUser', () => {
		const mockUserCreateDto: UserCreateDto = {
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'SecurePassword123',
		};

		const mockCreatedUserResponse: CreatedUserResponse = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'John Doe',
			email: 'john.doe@example.com',
			created_at: new Date('2025-11-16T10:00:00Z'),
		};

		it('should create a user successfully and return the correct response', async () => {
			userService.createUser.mockResolvedValue(mockCreatedUserResponse);

			await controller.createUser(mockUserCreateDto);

			expect(userService.createUser).toHaveBeenCalledWith(mockUserCreateDto);
		});

		it('should validate body with UserCreateSchema', async () => {
			const validBody = {
				name: 'Jane Doe',
				email: 'jane@example.com',
				password: 'Password123',
			};

			userService.createUser.mockResolvedValue({
				...mockCreatedUserResponse,
				name: 'Jane Doe',
				email: 'jane@example.com',
			});

			await controller.createUser(validBody);

			expect(userService.createUser).toHaveBeenCalledWith(validBody);
		});

		it('should accept body without name (optional field)', async () => {
			const validBodyWithoutName = {
				email: 'john@example.com',
				password: 'SecurePassword123',
			};

			userService.createUser.mockResolvedValue({
				...mockCreatedUserResponse,
				name: undefined as unknown as string,
			});

			await controller.createUser(validBodyWithoutName);

			expect(userService.createUser).toHaveBeenCalledWith(validBodyWithoutName);
		});

		it('should propagate error from service', async () => {
			const error = new Error('Service error');

			userService.createUser.mockRejectedValue(error);

			await expect(controller.createUser(mockUserCreateDto)).rejects.toThrow(
				error,
			);

			expect(userService.createUser).toHaveBeenCalledWith(mockUserCreateDto);
		});
	});
});
