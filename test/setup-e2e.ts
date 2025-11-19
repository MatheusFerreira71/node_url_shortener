// Mock nanoid for e2e tests to avoid ESM import issues
let counter = 0;
jest.mock('nanoid', () => ({
	nanoid: jest.fn(() => `abc${String(counter++).padStart(3, '0')}`),
}));
