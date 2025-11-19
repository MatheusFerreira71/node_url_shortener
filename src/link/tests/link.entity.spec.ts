import { Link } from '../link.entity';

describe('Link', () => {
	it('should be defined', () => {
		expect(new Link()).toBeDefined();
	});

	it('should create an instance with all properties', () => {
		const link = new Link();
		link.id = '123e4567-e89b-12d3-a456-426614174000';
		link.original_url = 'https://example.com/original';
		link.current_url = 'https://example.com/current';
		link.hash = 'abc123';
		link.times_clicked = 10;
		link.user_id = 'user-123';
		link.expires_at = new Date('2025-12-31');
		link.user = null;
		link.created_at = new Date();
		link.updated_at = new Date();
		link.deleted_at = null;

		expect(link.id).toBe('123e4567-e89b-12d3-a456-426614174000');
		expect(link.original_url).toBe('https://example.com/original');
		expect(link.current_url).toBe('https://example.com/current');
		expect(link.hash).toBe('abc123');
		expect(link.times_clicked).toBe(10);
		expect(link.user_id).toBe('user-123');
		expect(link.expires_at).toEqual(new Date('2025-12-31'));
		expect(link.user).toBeNull();
		expect(link.created_at).toBeInstanceOf(Date);
		expect(link.updated_at).toBeInstanceOf(Date);
		expect(link.deleted_at).toBeNull();
	});

	it('should allow null values for optional properties', () => {
		const link = new Link();
		link.user_id = null;
		link.expires_at = null;
		link.user = null;
		link.deleted_at = null;

		expect(link.user_id).toBeNull();
		expect(link.expires_at).toBeNull();
		expect(link.user).toBeNull();
		expect(link.deleted_at).toBeNull();
	});

	it('should accept valid hash with 6 characters', () => {
		const link = new Link();
		link.hash = 'abcd12';

		expect(link.hash).toBe('abcd12');
		expect(link.hash).toHaveLength(6);
	});

	it('should handle times_clicked as number', () => {
		const link = new Link();
		link.times_clicked = 0;

		expect(link.times_clicked).toBe(0);
		expect(typeof link.times_clicked).toBe('number');

		link.times_clicked = 999999;
		expect(link.times_clicked).toBe(999999);
	});

	it('should store original_url and current_url separately', () => {
		const link = new Link();
		link.original_url = 'https://example.com/original';
		link.current_url = 'https://example.com/updated';

		expect(link.original_url).toBe('https://example.com/original');
		expect(link.current_url).toBe('https://example.com/updated');
		expect(link.original_url).not.toBe(link.current_url);
	});

	it('should inherit BaseEntity properties', () => {
		const link = new Link();
		link.created_at = new Date('2025-01-01');
		link.updated_at = new Date('2025-01-02');
		link.deleted_at = new Date('2025-01-03');

		expect(link.created_at).toEqual(new Date('2025-01-01'));
		expect(link.updated_at).toEqual(new Date('2025-01-02'));
		expect(link.deleted_at).toEqual(new Date('2025-01-03'));
	});
});
