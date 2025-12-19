/**
 * Tests for src/withDevtools.ts
 * Tests the Expo DevTools middleware for Zustand
 */

import { getDevToolsPluginClientAsync } from 'expo/devtools';
import type { StateCreator, StoreApi } from 'zustand/vanilla';
import { devtools, type ExpoDevtoolsOptions, __resetDevToolsClient } from '../withDevtools';

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
		
		// Reset singleton client state
		__resetDevToolsClient();
		
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

	describe('Singleton client behavior', () => {
		it('should initialize client only once for multiple stores', async () => {
			const storeInitializer1: StateCreator<any, [], []> = () => ({ count: 0 });
			const storeInitializer2: StateCreator<any, [], []> = () => ({ count: 10 });
			
			const middleware1 = devtools(storeInitializer1, { name: 'store-1' });
			const middleware2 = devtools(storeInitializer2, { name: 'store-2' });
			
			// Create two stores
			const mockApi1 = { ...mockApi };
			const mockApi2 = { ...mockApi };
			
			middleware1(mockSet, mockGet, mockApi1);
			middleware2(mockSet, mockGet, mockApi2);
			
			// Wait for async initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// getDevToolsPluginClientAsync should only be called once
			expect(getDevToolsPluginClientAsync).toHaveBeenCalledTimes(1);
		});

		it('should log initialization message only once for multiple stores', async () => {
			const consoleSpy = jest.spyOn(console, 'log');
			
			const storeInitializer1: StateCreator<any, [], []> = () => ({ count: 0 });
			const storeInitializer2: StateCreator<any, [], []> = () => ({ count: 10 });
			const storeInitializer3: StateCreator<any, [], []> = () => ({ count: 20 });
			
			const middleware1 = devtools(storeInitializer1, { name: 'store-1' });
			const middleware2 = devtools(storeInitializer2, { name: 'store-2' });
			const middleware3 = devtools(storeInitializer3, { name: 'store-3' });
			
			// Create three stores
			const mockApi1 = { ...mockApi };
			const mockApi2 = { ...mockApi };
			const mockApi3 = { ...mockApi };
			
			middleware1(mockSet, mockGet, mockApi1);
			middleware2(mockSet, mockGet, mockApi2);
			middleware3(mockSet, mockGet, mockApi3);
			
			// Wait for async initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Should only log once
			const initLogs = consoleSpy.mock.calls.filter(call => 
				call[0] && call[0].includes('[Zustand DevTools] Client initialized')
			);
			expect(initLogs.length).toBe(1);
			
			consoleSpy.mockRestore();
		});

		it('should send init message for each store independently', async () => {
			const store1State = { count: 0 };
			const store2State = { count: 10 };
			
			const storeInitializer1: StateCreator<any, [], []> = () => store1State;
			const storeInitializer2: StateCreator<any, [], []> = () => store2State;
			
			const middleware1 = devtools(storeInitializer1, { name: 'store-1' });
			const middleware2 = devtools(storeInitializer2, { name: 'store-2' });
			
			const mockApi1 = { ...mockApi };
			const mockApi2 = { ...mockApi };
			
			middleware1(mockSet, mockGet, mockApi1);
			middleware2(mockSet, mockGet, mockApi2);
			
			// Wait for async initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Should have called sendMessage with init for each store
			expect(mockClient.sendMessage).toHaveBeenCalledWith('init', {
				name: 'store-1',
				state: store1State,
			});
			expect(mockClient.sendMessage).toHaveBeenCalledWith('init', {
				name: 'store-2',
				state: store2State,
			});
		});
	});

	describe('Persist rehydration', () => {
	it('should use @@REHYDRATE action name when setState is called with replace=true', async () => {
		// This test verifies that when persist rehydrates (using setState with replace=true),
		// the action name will be @@REHYDRATE
		
		const originalSetState = jest.fn();
		mockApi.setState = originalSetState;
		
		const storeInitializer: StateCreator<any, [], []> = () => initialState;
		const middleware = devtools(storeInitializer);
		
		middleware(mockSet, mockGet, mockApi);
		
		// Wait for client initialization
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Clear init message
		mockClient.sendMessage.mockClear();
		
		// Simulate persist middleware calling setState with replace=true (no action name)
		const rehydratedState = { count: 42, name: 'rehydrated' };
		mockGet.mockReturnValue(rehydratedState);
		(mockApi.setState as any)(rehydratedState, true); // replace=true, no action name
		
		// The setState call with replace=true should use @@REHYDRATE
		expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
			type: '@@REHYDRATE',
			state: rehydratedState,
		}));
	});

		it('should use anonymous action for setState after initialization', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			// Wait for initialization to complete
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Clear previous sendMessage calls
			mockClient.sendMessage.mockClear();
			
			// Call setState after initialization without action name
			const newState = { count: 5, name: 'updated' };
			mockGet.mockReturnValue(newState);
			(mockApi.setState as any)(newState);
			
			// Should use 'anonymous' instead of '@@REHYDRATE'
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'anonymous',
				state: newState,
			}));
		});

		it('should use custom anonymousActionType instead of @@REHYDRATE after initialization', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			const options: ExpoDevtoolsOptions = { anonymousActionType: 'CUSTOM_ANONYMOUS' };
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, options);
			
			middleware(mockSet, mockGet, mockApi);
			
			// Wait for initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Clear previous calls
			mockClient.sendMessage.mockClear();
			
			// Call setState without action name after initialization
			(mockApi.setState as any)({ count: 10 });
			
			// Should use custom anonymous action type
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'CUSTOM_ANONYMOUS',
			}));
		});
		
		it('should not use @@REHYDRATE for stores without persist middleware', async () => {
			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;
			
			// Store without persist - no setState calls during initialization
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer);
			
			middleware(mockSet, mockGet, mockApi);
			
			// Wait for initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Clear previous calls
			mockClient.sendMessage.mockClear();
			
			// Call setState after initialization without action name
			const newState = { count: 99, name: 'test' };
			mockGet.mockReturnValue(newState);
			(mockApi.setState as any)(newState);
			
			// Should use 'anonymous', NOT '@@REHYDRATE'
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				type: 'anonymous',
				state: newState,
			}));
			
			// Verify @@REHYDRATE was never used
			const allCalls = mockClient.sendMessage.mock.calls;
			const rehydrateCalls = allCalls.filter((call: any) => 
				call[0] === 'state' && call[1]?.type === '@@REHYDRATE'
			);
			expect(rehydrateCalls).toHaveLength(0);
		});
	});

	describe('Serialization options', () => {
		it('should serialize state with custom replacer', async () => {
			const replacer = jest.fn((key: string, value: unknown) => {
				if (key === 'secret') {
					return '[REDACTED]';
				}
				return value;
			});

			const stateWithSecret = { count: 0, secret: 'password123' };
			const storeInitializer: StateCreator<any, [], []> = () => stateWithSecret;
			const middleware = devtools(storeInitializer, {
				name: 'test-store',
				serialize: { replacer },
			});

			mockGet.mockReturnValue(stateWithSecret);
			middleware(mockSet, mockGet, mockApi);

			await new Promise(resolve => setTimeout(resolve, 100));

			// The replacer should have been called during serialization
			expect(replacer).toHaveBeenCalled();
		});

		it('should deserialize state with custom reviver', async () => {
			const reviver = jest.fn((key: string, value: unknown) => {
				if (key === 'date' && typeof value === 'string') {
					return new Date(value);
				}
				return value;
			});

			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, {
				name: 'test-store',
				serialize: { reviver },
			});

			middleware(mockSet, mockGet, mockApi);

			await new Promise(resolve => setTimeout(resolve, 100));

			const dispatchHandler = mockClient.addMessageListener.mock.calls[0][1];

			// Simulate state with serialized date
			const stateWithDate = { count: 1, date: '2025-01-01T00:00:00.000Z' };
			dispatchHandler({
				type: 'DISPATCH',
				action: { type: 'JUMP_TO_STATE' },
				state: JSON.stringify(stateWithDate),
				instanceId: 'test-store',
			});

			// The reviver should have been called during deserialization
			expect(reviver).toHaveBeenCalled();
		});

		it('should handle serialization when serialize is true', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, {
				name: 'test-store',
				serialize: true,
			});

			middleware(mockSet, mockGet, mockApi);

			await new Promise(resolve => setTimeout(resolve, 100));

			// Should still send init message successfully
			expect(mockClient.sendMessage).toHaveBeenCalledWith('init', {
				name: 'test-store',
				state: initialState,
			});
		});

		it('should not serialize when serialize option is not provided', async () => {
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, { name: 'test-store' });

			middleware(mockSet, mockGet, mockApi);

			await new Promise(resolve => setTimeout(resolve, 100));

			// State should be sent as-is
			expect(mockClient.sendMessage).toHaveBeenCalledWith('init', {
				name: 'test-store',
				state: initialState,
			});
		});

		it('should apply replacer to both init and state update messages', async () => {
			const replacer = jest.fn((key: string, value: unknown) => value);
			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, {
				name: 'test-store',
				serialize: { replacer },
			});

			const originalSetState = jest.fn();
			mockApi.setState = originalSetState;

			middleware(mockSet, mockGet, mockApi);

			await new Promise(resolve => setTimeout(resolve, 100));

			// Clear the init message calls
			replacer.mockClear();

			// Trigger a state update
			const newState = { count: 5, name: 'updated' };
			mockGet.mockReturnValue(newState);
			(mockApi.setState as any)(newState, false, 'update');

			// Replacer should be called for state update too
			expect(replacer).toHaveBeenCalled();
		});

		it('should handle serialization errors gracefully', async () => {
			const replacer = jest.fn(() => {
				throw new Error('Serialization failed');
			});

			const storeInitializer: StateCreator<any, [], []> = () => initialState;
			const middleware = devtools(storeInitializer, {
				name: 'test-store',
				serialize: { replacer },
			});

			// Should not throw
			expect(() => middleware(mockSet, mockGet, mockApi)).not.toThrow();

			await new Promise(resolve => setTimeout(resolve, 100));

			// Should still send a message (with original state as fallback)
			expect(mockClient.sendMessage).toHaveBeenCalled();
		});
	});

	describe('Multiple store instances', () => {
		it('should handle @@REHYDRATE per-store correctly', async () => {
			// Create two separate store instances with different rehydration behavior
			const originalSetState1 = jest.fn();
			const mockApi1 = { ...mockApi, setState: originalSetState1 };
			
			const originalSetState2 = jest.fn();
			const mockApi2 = { ...mockApi, setState: originalSetState2 };
			
			// Store 1: with persist
			const storeInit1: StateCreator<any, [], []> = () => initialState;
			
			// Store 2: without persist
			const storeInit2: StateCreator<any, [], []> = () => ({ count: 0, name: 'store2' });
			
			const middleware1 = devtools(storeInit1, { name: 'store1' });
			const middleware2 = devtools(storeInit2, { name: 'store2' });
			
			middleware1(mockSet, mockGet, mockApi1);
			middleware2(mockSet, mockGet, mockApi2);
			
			// Wait for initialization
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Clear init messages
			mockClient.sendMessage.mockClear();
			
			// Store 1: Simulate persist calling setState with replace=true
			const rehydratedState1 = { count: 100, name: 'store1-rehydrated' };
			mockGet.mockReturnValue(rehydratedState1);
			(mockApi1.setState as any)(rehydratedState1, true); // Persist uses replace=true
			
			// Check that store1 setState with replace=true got @@REHYDRATE
			const store1Calls = mockClient.sendMessage.mock.calls.filter((call: any) => 
				call[0] === 'state' && call[1]?.name === 'store1'
			);
			expect(store1Calls.some((call: any) => call[1]?.type === '@@REHYDRATE')).toBe(true);
			
			// Clear and test store2 behavior (no persist)
			mockClient.sendMessage.mockClear();
			const newState2 = { count: 50, name: 'store2-updated' };
			mockGet.mockReturnValue(newState2);
			(mockApi2.setState as any)(newState2); // No replace flag
			
			// Store2 should use 'anonymous' (not @@REHYDRATE) since replace=false
			expect(mockClient.sendMessage).toHaveBeenCalledWith('state', expect.objectContaining({
				name: 'store2',
				type: 'anonymous',
				state: newState2,
			}));
		});
	});
});
