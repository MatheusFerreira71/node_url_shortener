import { Link } from '../../link/link.entity';
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

	describe('Relations', () => {
		it('should have a links property', () => {
			user.links = [];
			expect(user.links).toBeDefined();
			expect(Array.isArray(user.links)).toBe(true);
		});

		it('should allow multiple links to be associated', () => {
			const link1 = new Link();
			link1.id = 'link-1';
			link1.original_url = 'https://example.com/1';
			link1.current_url = 'https://example.com/1';
			link1.hash = 'abc123';

			const link2 = new Link();
			link2.id = 'link-2';
			link2.original_url = 'https://example.com/2';
			link2.current_url = 'https://example.com/2';
			link2.hash = 'def456';

			user.links = [link1, link2];

			expect(user.links).toHaveLength(2);
			expect(user.links[0]).toBe(link1);
			expect(user.links[1]).toBe(link2);
		});

		it('should maintain link references', () => {
			const link = new Link();
			link.id = 'link-test';
			link.original_url = 'https://test.com';
			link.current_url = 'https://test.com';
			link.hash = 'test12';

			user.links = [link];

			expect(user.links[0].id).toBe('link-test');
			expect(user.links[0].original_url).toBe('https://test.com');
			expect(user.links[0].hash).toBe('test12');
		});

		it('should allow empty links array', () => {
			user.links = [];
			expect(user.links).toHaveLength(0);
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
