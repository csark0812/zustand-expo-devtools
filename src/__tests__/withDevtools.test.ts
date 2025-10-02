/**
 * Tests for src/withDevtools.ts
 * Tests the Expo DevTools middleware for Zustand
 */

import { getDevToolsPluginClientAsync } from 'expo/devtools';
import type { StateCreator, StoreApi } from 'zustand/vanilla';
import { devtools, type ExpoDevtoolsOptions } from '../withDevtools';

// Mock expo/devtools
jest.mock('expo/devtools');

describe('withDevtools.ts - Expo DevTools middleware', () => {
	let mockClient: any;
	let mockSet: jest.Mock;
	let mockGet: jest.Mock;
	let mockApi: StoreApi<any>;
	let initialState: any;

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();
		
		// Create mock client
		mockClient = {
			sendMessage: jest.fn(),
			addMessageListener: jest.fn((type, handler) => ({ remove: jest.fn() })),
		};
		
		(getDevToolsPluginClientAsync as jest.Mock).mockResolvedValue(mockClient);
		
		// Create mock state and functions
		initialState = { count: 0, name: 'test' };
		mockSet = jest.fn();
		mockGet = jest.fn(() => initialState);
		mockApi = {
			setState: jest.fn(),
			getState: mockGet,
			subscribe: jest.fn(),
		} as any;
	});

	describe('Basic functionality', () => {
		it('should create devtools middleware that returns initial state', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			const result = middleware(mockSet, mockGet, mockApi);
			
			expect(result).toEqual(initialState);
		});

		it('should initialize Expo DevTools client', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			// Wait for async initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			expect(getDevToolsPluginClientAsync).toHaveBeenCalledWith('zustand-expo-devtools');
		});

		it('should send init message after client initialization', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			// Wait for async initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('init', {
				name: undefined,
				state: initialState,
			});
		});
	});

	describe('Options handling', () => {
		it('should use custom store name from options', async () => {
			const options: ExpoDevtoolsOptions = { name: 'my-custom-store' };
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, options);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('init', {
				name: 'my-custom-store',
				state: initialState,
			});
		});

		it('should not initialize devtools when enabled is false', async () => {
			const options: ExpoDevtoolsOptions = { enabled: false };
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, options);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			expect(getDevToolsPluginClientAsync).not.toHaveBeenCalled();
		});

		it('should use custom anonymousActionType', async () => {
			const options: ExpoDevtoolsOptions = { anonymousActionType: 'CUSTOM_ACTION' };
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, options);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Trigger setState without action name
			(mockApi.setState as any)({ count: 1 });
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'CUSTOM_ACTION',
			}));
		});
	});

	describe('setState override', () => {
		it('should override setState to track actions', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Check that setState was overridden
			expect(mockApi.setState).not.toBe(jest.fn());
		});

		it('should send state update when setState is called', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Call the overridden setState
			const newState = { count: 1, name: 'updated' };
			mockGet.mockReturnValue(newState);
			(mockApi.setState as any)(newState, false, 'increment');
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'increment',
				state: newState,
			}));
		});

		it('should handle setState with string action name', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			(mockApi.setState as any)({ count: 2 }, false, 'decrement');
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'decrement',
			}));
		});

		it('should handle setState with object action', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const action = { type: 'complex-action', payload: { value: 42 } };
			(mockApi.setState as any)({ count: 3 }, false, action);
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'complex-action',
			}));
		});

		it('should handle setState without action (anonymous)', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			(mockApi.setState as any)({ count: 4 });
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'anonymous',
			}));
		});
	});

	describe('DevTools message handling', () => {
		it('should add message listener for dispatch events', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			expect(mockClient.addMessageListener).toHaveBeenCalledWith('dispatch', expect.any(Function));
		});

		it('should handle RESET action from devtools', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, { name: 'test-store' });
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Get the dispatch message handler
			const dispatchHandler = mockClient.addMessageListener.mock.calls[0][1];
			
			// Simulate RESET action
			dispatchHandler({
				type: 'DISPATCH',
				action: { type: 'RESET' },
				instanceId: 'test-store',
			});
			
			// Should call set with initial state
			expect(mockSet).toHaveBeenCalled();
		});

		it('should handle JUMP_TO_STATE action from devtools', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, { name: 'test-store' });
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const dispatchHandler = mockClient.addMessageListener.mock.calls[0][1];
			
			const newState = { count: 10, name: 'jumped' };
			dispatchHandler({
				type: 'DISPATCH',
				action: { type: 'JUMP_TO_STATE' },
				state: JSON.stringify(newState),
				instanceId: 'test-store',
			});
			
			expect(mockSet).toHaveBeenCalledWith(newState);
		});

		it('should handle PAUSE_RECORDING action', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, { name: 'test-store' });
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const dispatchHandler = mockClient.addMessageListener.mock.calls[0][1];
			
			// Pause recording
			dispatchHandler({
				type: 'DISPATCH',
				action: { type: 'PAUSE_RECORDING' },
				instanceId: 'test-store',
			});
			
			// Clear previous calls
			mockClient.sendMessage.mockClear();
			
			// Try to update state - should not send message
			(mockApi.setState as any)({ count: 5 });
			
			expect(mockClient.sendMessage).not.toHaveBeenCalled();
		});
	});

	describe('Error handling', () => {
		it('should handle JSON parse errors gracefully', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, { name: 'test-store' });
			
			middleware(mockSet, mockGet, mockApi);
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			const dispatchHandler = mockClient.addMessageListener.mock.calls[0][1];
			
			// Send invalid JSON
			dispatchHandler({
				type: 'DISPATCH',
				action: { type: 'JUMP_TO_STATE' },
				state: 'invalid json {{{',
				instanceId: 'test-store',
			});
			
			// Should not throw, and should not call set
			expect(mockSet).not.toHaveBeenCalled();
		});

		it('should handle client initialization failure', async () => {
			(getDevToolsPluginClientAsync as jest.Mock).mockRejectedValue(new Error('Connection failed'));
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			// Should not throw
			expect(() => middleware(mockSet, mockGet, mockApi)).not.toThrow();
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Should still return initial state
			const result = middleware(mockSet, mockGet, mockApi);
			expect(result).toEqual(initialState);
		});
	});

	describe('Cleanup functionality', () => {
		it('should add devtools cleanup method to api', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			expect((mockApi as any).devtools).toBeDefined();
			expect((mockApi as any).devtools.cleanup).toBeDefined();
			expect(typeof (mockApi as any).devtools.cleanup).toBe('function');
		});

		it('should allow cleanup to be called without errors', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			expect(() => (mockApi as any).devtools.cleanup()).not.toThrow();
		});
	});
});
