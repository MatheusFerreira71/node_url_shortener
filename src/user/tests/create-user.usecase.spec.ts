import { ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { BcryptService } from '../../bcrypt/bcrypt.service';
import { CreateUserUsecase } from '../usecases';
import type { User } from '../user.entity';
import type { CreatedUserResponse, UserCreateDto } from '../user.types';

describe('CreateUserUsecase', () => {
	let createUser: CreateUserUsecase;
	let usersRepository: jest.Mocked<Repository<User>>;
	let bcryptService: jest.Mocked<BcryptService>;

	beforeEach(() => {
		usersRepository = {
			findOne: jest.fn(),
			create: jest.fn(),
			save: jest.fn(),
		} as unknown as jest.Mocked<Repository<User>>;

		bcryptService = {
			hash: jest.fn(),
		} as unknown as jest.Mocked<BcryptService>;

		createUser = new CreateUserUsecase(usersRepository, bcryptService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(createUser).toBeDefined();
	});

	describe('execute', () => {
		const mockUserCreateDto: UserCreateDto = {
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: 'SecurePassword123',
		};

		const mockHashedPassword = 'hashed_password_123';

		const mockCreatedUser: User = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'John Doe',
			email: 'john.doe@example.com',
			password: mockHashedPassword,
			created_at: new Date('2025-11-16T10:00:00Z'),
			updated_at: new Date('2025-11-16T10:00:00Z'),
			deleted_at: null,
		};

		it('should create a user successfully when email does not exist', async () => {
			const userDto = { ...mockUserCreateDto };

			usersRepository.findOne.mockResolvedValue(null);
			bcryptService.hash.mockResolvedValue(mockHashedPassword);
			usersRepository.create.mockReturnValue(mockCreatedUser);
			usersRepository.save.mockResolvedValue(mockCreatedUser);

			const result: CreatedUserResponse = await createUser.execute(userDto);

			expect(usersRepository.findOne).toHaveBeenCalledWith({
				where: { email: userDto.email },
			});
			expect(bcryptService.hash).toHaveBeenCalledWith('SecurePassword123');
			expect(usersRepository.create).toHaveBeenCalledWith({
				name: userDto.name,
				email: userDto.email,
				password: mockHashedPassword,
			});
			expect(usersRepository.save).toHaveBeenCalledWith(mockCreatedUser);
			expect(result).toEqual({
				id: mockCreatedUser.id,
				name: mockCreatedUser.name,
				email: mockCreatedUser.email,
				created_at: mockCreatedUser.created_at,
			});
		});

		it('should throw ConflictException when email already exists', async () => {
			const existingUser: User = {
				id: '999e4567-e89b-12d3-a456-426614174999',
				name: 'Existing User',
				email: mockUserCreateDto.email,
				password: 'existing_hashed_password',
				created_at: new Date('2025-01-01T10:00:00Z'),
				updated_at: new Date('2025-01-01T10:00:00Z'),
				deleted_at: null,
			};

			usersRepository.findOne.mockResolvedValue(existingUser);

			await expect(createUser.execute(mockUserCreateDto)).rejects.toThrow(
				ConflictException,
			);
			await expect(createUser.execute(mockUserCreateDto)).rejects.toThrow(
				'E-mail já está sendo usado',
			);

			expect(usersRepository.findOne).toHaveBeenCalledWith({
				where: { email: mockUserCreateDto.email },
			});
			expect(bcryptService.hash).not.toHaveBeenCalled();
			expect(usersRepository.create).not.toHaveBeenCalled();
			expect(usersRepository.save).not.toHaveBeenCalled();
		});

		it('should create a new object with hashed password without modifying the original DTO', async () => {
			const userDtoCopy = { ...mockUserCreateDto };
			const originalPassword = userDtoCopy.password;

			usersRepository.findOne.mockResolvedValue(null);
			bcryptService.hash.mockResolvedValue(mockHashedPassword);
			usersRepository.create.mockReturnValue(mockCreatedUser);
			usersRepository.save.mockResolvedValue(mockCreatedUser);

			await createUser.execute(userDtoCopy);

			expect(userDtoCopy.password).toBe(originalPassword);
			expect(usersRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					password: mockHashedPassword,
				}),
			);
		});

		it('should return only allowed fields (id, name, email, created_at)', async () => {
			usersRepository.findOne.mockResolvedValue(null);
			bcryptService.hash.mockResolvedValue(mockHashedPassword);
			usersRepository.create.mockReturnValue(mockCreatedUser);
			usersRepository.save.mockResolvedValue(mockCreatedUser);

			const result = await createUser.execute(mockUserCreateDto);

			expect(result).toEqual({
				id: mockCreatedUser.id,
				name: mockCreatedUser.name,
				email: mockCreatedUser.email,
				created_at: mockCreatedUser.created_at,
			});
			expect(result).not.toHaveProperty('password');
			expect(result).not.toHaveProperty('updated_at');
			expect(result).not.toHaveProperty('deleted_at');
		});

		it('should propagate error when hash fails', async () => {
			const hashError = new Error('Hash generation failed');

			usersRepository.findOne.mockResolvedValue(null);
			bcryptService.hash.mockRejectedValue(hashError);

			await expect(createUser.execute(mockUserCreateDto)).rejects.toThrow(
				hashError,
			);

			expect(usersRepository.findOne).toHaveBeenCalled();
			expect(bcryptService.hash).toHaveBeenCalled();
			expect(usersRepository.create).not.toHaveBeenCalled();
			expect(usersRepository.save).not.toHaveBeenCalled();
		});

		it('should propagate error when save fails', async () => {
			const saveError = new Error('Database save failed');

			usersRepository.findOne.mockResolvedValue(null);
			bcryptService.hash.mockResolvedValue(mockHashedPassword);
			usersRepository.create.mockReturnValue(mockCreatedUser);
			usersRepository.save.mockRejectedValue(saveError);

			await expect(createUser.execute(mockUserCreateDto)).rejects.toThrow(
				saveError,
			);

			expect(usersRepository.findOne).toHaveBeenCalled();
			expect(bcryptService.hash).toHaveBeenCalled();
			expect(usersRepository.create).toHaveBeenCalled();
			expect(usersRepository.save).toHaveBeenCalled();
		});
	});
});
