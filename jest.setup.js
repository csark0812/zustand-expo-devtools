// Jest setup file
global.console = {
	...console,
	// Suppress console logs during tests unless needed
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
};

// Mock window for browser-like tests
if (typeof window === 'undefined') {
	global.window = {};
}
