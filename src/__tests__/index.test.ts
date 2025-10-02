/**
 * Tests for src/index.ts
 * Tests the conditional devtools export based on NODE_ENV
 */

describe('index.ts - conditional devtools export', () => {
	let originalEnv: string | undefined;

	beforeEach(() => {
		originalEnv = process.env.NODE_ENV;
		// Clear the require cache
		jest.resetModules();
	});

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	it('should export devtools middleware in non-production environment', () => {
		process.env.NODE_ENV = 'development';
		
		// Re-import after setting NODE_ENV
		const indexModule = require('../index');
		
		expect(indexModule.devtools).toBeDefined();
		expect(typeof indexModule.devtools).toBe('function');
	});

	it('should export devtools middleware in test environment', () => {
		process.env.NODE_ENV = 'test';
		
		const indexModule = require('../index');
		
		expect(indexModule.devtools).toBeDefined();
		expect(typeof indexModule.devtools).toBe('function');
	});

	it('should export pass-through function in production environment', () => {
		process.env.NODE_ENV = 'production';
		
		const indexModule = require('../index');
		
		expect(indexModule.devtools).toBeDefined();
		expect(typeof indexModule.devtools).toBe('function');
		
		// Test that it's a pass-through function
		const testFn = jest.fn((x: number) => x * 2);
		const result = indexModule.devtools(testFn);
		expect(result).toBe(testFn);
	});
});
