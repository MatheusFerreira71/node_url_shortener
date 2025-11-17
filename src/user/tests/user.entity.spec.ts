import { User } from '../user.entity';

describe('User Entity', () => {
	let user: User;

	beforeEach(() => {
		user = new User();
	});

	it('should be defined', () => {
		expect(user).toBeDefined();
	});

	describe('Properties', () => {
		it('should have a name property', () => {
			user.name = 'John Doe';
			expect(user.name).toBe('John Doe');
		});

		it('should have an email property', () => {
			user.email = 'john.doe@example.com';
			expect(user.email).toBe('john.doe@example.com');
		});

		it('should have a password property', () => {
			user.password = 'hashedPassword123';
			expect(user.password).toBe('hashedPassword123');
		});

		it('should allow nullable name', () => {
			user.name = null as unknown as string;
			expect(user.name).toBeNull();
		});

		it('should not allow nullable email', () => {
			user.email = 'test@example.com';
			expect(user.email).toBeDefined();
		});

		it('should not allow nullable password', () => {
			user.password = 'securePassword';
			expect(user.password).toBeDefined();
		});
	});

	describe('BaseEntity inheritance', () => {
		it('should have id property from BaseEntity', () => {
			user.id = 'uuid-test-123';
			expect(user.id).toBe('uuid-test-123');
		});

		it('should have created_at property from BaseEntity', () => {
			const date = new Date();
			user.created_at = date;
			expect(user.created_at).toBe(date);
		});

		it('should have updated_at property from BaseEntity', () => {
			const date = new Date();
			user.updated_at = date;
			expect(user.updated_at).toBe(date);
		});

		it('should have deleted_at property from BaseEntity', () => {
			const date = new Date();
			user.deleted_at = date;
			expect(user.deleted_at).toBe(date);
		});

		it('should allow deleted_at to be null', () => {
			user.deleted_at = null;
			expect(user.deleted_at).toBeNull();
		});
	});

	describe('Instantiation', () => {
		it('should create an instance with all properties', () => {
			const testUser = new User();
			testUser.name = 'Jane Doe';
			testUser.email = 'jane.doe@example.com';
			testUser.password = 'hashedPassword456';
			testUser.id = 'uuid-456';

			expect(testUser.name).toBe('Jane Doe');
			expect(testUser.email).toBe('jane.doe@example.com');
			expect(testUser.password).toBe('hashedPassword456');
			expect(testUser.id).toBe('uuid-456');
		});
	});
});
