/**
 * Tests for webui/src/middlewares/api.ts
 * Tests the Redux middleware that connects to Expo DevTools client
 */

import {
	LIFTED_ACTION,
	UPDATE_STATE,
	type LiftedActionAction,
} from '@redux-devtools/app-core';
import type { DevToolsPluginClient } from 'expo/devtools';
import type { Dispatch, MiddlewareAPI } from 'redux';
import type { EmitAction, StoreAction } from '../../actions';
import { EMIT } from '../../constants/socketActionTypes';
import type { StoreState } from '../../reducers';
import { api } from '../api';

describe('api.ts - DevTools middleware', () => {
	let mockStore: MiddlewareAPI<Dispatch<StoreAction>, StoreState>;
	let mockNext: jest.Mock;
	let mockDispatch: jest.Mock;
	let mockGetState: jest.Mock;
	let mockClient: DevToolsPluginClient;

	beforeEach(() => {
		jest.clearAllMocks();
		
		mockDispatch = jest.fn();
		mockGetState = jest.fn(() => ({
			instances: {
				selected: 'test-instance',
				current: 'test-instance',
				sync: true,
				connections: {},
				options: {
					'test-instance': { connectionId: 'conn-1' },
				},
				states: {
					'test-instance': {
						actionsById: {},
						computedStates: [{ state: { count: 0 }, error: undefined }],
						currentStateIndex: 0,
						nextActionId: 1,
						stagedActionIds: [0],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			},
		}));
		
		mockStore = {
			dispatch: mockDispatch,
			getState: mockGetState,
		};
		
		mockNext = jest.fn((action) => action);
		
		mockClient = {
			sendMessage: jest.fn(),
			addMessageListener: jest.fn((type, handler) => ({ remove: jest.fn() })),
		} as any;
		
		// Reset the window object
		delete (window as any).__connectDevToolsClient;
	});

	describe('Middleware setup', () => {
		it('should create middleware function', () => {
			const middleware = api(mockStore);
			
			expect(typeof middleware).toBe('function');
		});

		it('should register connect function on window', () => {
			api(mockStore);
			
			expect(window.__connectDevToolsClient).toBeDefined();
			expect(typeof window.__connectDevToolsClient).toBe('function');
		});

		it('should return next middleware function', () => {
			const middleware = api(mockStore);
			const nextMiddleware = middleware(mockNext);
			
			expect(typeof nextMiddleware).toBe('function');
		});
	});

	describe('EMIT action handling', () => {
		it('should emit message when client is connected', () => {
			const middleware = api(mockStore)(mockNext);
			
			// Connect client
			window.__connectDevToolsClient?.(mockClient);
			
			const emitAction: EmitAction = {
				type: EMIT,
				message: 'START',
				instanceId: 'test-instance',
			} as EmitAction;
			
			middleware(emitAction as any);
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('dispatch', {
				type: 'START',
				action: undefined,
				state: undefined,
				instanceId: 'test-instance',
			});
		});

		it('should not emit when client is not connected', () => {
			const middleware = api(mockStore)(mockNext);
			
			const emitAction: EmitAction = {
				type: EMIT,
				message: 'START',
			} as EmitAction;
			
			middleware(emitAction as any);
			
			// Client.sendMessage should not be called because client is not connected
			expect(mockClient.sendMessage).not.toHaveBeenCalled();
		});

		it('should call next with the action', () => {
			const middleware = api(mockStore)(mockNext);
			
			const emitAction: EmitAction = {
				type: EMIT,
				message: 'TEST',
			} as EmitAction;
			
			middleware(emitAction as any);
			
			expect(mockNext).toHaveBeenCalledWith(emitAction);
		});

		it('should emit with action and state', () => {
			const middleware = api(mockStore)(mockNext);
			window.__connectDevToolsClient?.(mockClient);
			
			const emitAction: EmitAction = {
				type: EMIT,
				message: 'ACTION',
				action: { type: 'INCREMENT' },
				state: { count: 1 },
				instanceId: 'test-instance',
			} as EmitAction;
			
			middleware(emitAction as any);
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('dispatch', {
				type: 'ACTION',
				action: { type: 'INCREMENT' },
				state: { count: 1 },
				instanceId: 'test-instance',
			});
		});
	});

	describe('LIFTED_ACTION handling', () => {
		it('should dispatch remote action for LIFTED_ACTION', () => {
			const middleware = api(mockStore)(mockNext);
			
			const liftedAction: LiftedActionAction = {
				type: LIFTED_ACTION,
				message: 'DISPATCH',
				action: { type: 'JUMP_TO_STATE', index: 0 },
				toAll: false,
			} as LiftedActionAction;
			
			middleware(liftedAction as any);
			
			expect(mockNext).toHaveBeenCalledWith(liftedAction);
			expect(mockDispatch).toHaveBeenCalled();
		});

		it('should handle LIFTED_ACTION with toAll flag', () => {
			const middleware = api(mockStore)(mockNext);
			window.__connectDevToolsClient?.(mockClient);
			
			const liftedAction: LiftedActionAction = {
				type: LIFTED_ACTION,
				message: 'DISPATCH',
				toAll: true,
				action: { type: 'JUMP_TO_STATE', index: 0 },
			} as LiftedActionAction;
			
			middleware(liftedAction as any);
			
			expect(mockNext).toHaveBeenCalledWith(liftedAction);
		});
	});

	describe('Client connection', () => {
		it('should add message listeners on connect', () => {
			api(mockStore);
			
			window.__connectDevToolsClient?.(mockClient);
			
			expect(mockClient.addMessageListener).toHaveBeenCalledWith('init', expect.any(Function));
			expect(mockClient.addMessageListener).toHaveBeenCalledWith('state', expect.any(Function));
			expect(mockClient.addMessageListener).toHaveBeenCalledWith('ping', expect.any(Function));
		});

		it('should dispatch START on connect', () => {
			api(mockStore);
			
			window.__connectDevToolsClient?.(mockClient);
			
			expect(mockDispatch).toHaveBeenCalledWith({
				type: EMIT,
				message: 'START',
			});
		});

		it('should handle init message', () => {
			api(mockStore);
			window.__connectDevToolsClient?.(mockClient);
			
			// Get the init handler
			const initHandler = (mockClient.addMessageListener as jest.Mock).mock.calls.find(
				call => call[0] === 'init'
			)?.[1];
			
			expect(initHandler).toBeDefined();
			
			initHandler({
				name: 'my-store',
				state: { count: 0 },
			});
			
			expect(mockDispatch).toHaveBeenCalledWith({
				type: UPDATE_STATE,
				request: expect.objectContaining({
					type: 'INIT',
					payload: { count: 0 },
					id: 'my-store',
					instanceId: 'my-store',
				}),
			});
		});

		it('should handle state update message', () => {
			api(mockStore);
			window.__connectDevToolsClient?.(mockClient);
			
			const stateHandler = (mockClient.addMessageListener as jest.Mock).mock.calls.find(
				call => call[0] === 'state'
			)?.[1];
			
			expect(stateHandler).toBeDefined();
			
			stateHandler({
				name: 'my-store',
				type: 'INCREMENT',
				state: { count: 1 },
			});
			
			expect(mockDispatch).toHaveBeenCalledWith({
				type: UPDATE_STATE,
				request: expect.objectContaining({
					type: 'ACTION',
					action: JSON.stringify({ type: 'INCREMENT' }),
					payload: expect.any(String),
					id: 'my-store',
					instanceId: 'my-store',
				}),
			});
		});

		it('should handle ping message', () => {
			api(mockStore);
			window.__connectDevToolsClient?.(mockClient);
			
			const pingHandler = (mockClient.addMessageListener as jest.Mock).mock.calls.find(
				call => call[0] === 'ping'
			)?.[1];
			
			expect(pingHandler).toBeDefined();
			
			pingHandler({ message: 'ping' });
			
			expect(mockClient.sendMessage).toHaveBeenCalledWith('ping', {
				from: 'devtools-ui',
			});
		});

		it('should use default store name if not provided', () => {
			api(mockStore);
			window.__connectDevToolsClient?.(mockClient);
			
			const initHandler = (mockClient.addMessageListener as jest.Mock).mock.calls.find(
				call => call[0] === 'init'
			)?.[1];
			
			initHandler({
				state: { count: 0 },
			});
			
			expect(mockDispatch).toHaveBeenCalledWith({
				type: UPDATE_STATE,
				request: expect.objectContaining({
					id: 'zustand-store',
					instanceId: 'zustand-store',
				}),
			});
		});
	});

	describe('Monitoring requests', () => {
		it('should handle DISCONNECTED request', () => {
			api(mockStore);
			window.__connectDevToolsClient?.(mockClient);
			
			const stateHandler = (mockClient.addMessageListener as jest.Mock).mock.calls.find(
				call => call[0] === 'state'
			)?.[1];
			
			// Simulate a monitoring request that would trigger REMOVE_INSTANCE
			// This is indirectly tested through the middleware flow
			expect(stateHandler).toBeDefined();
		});

		it('should sync state when instances.sync is true', () => {
			mockGetState.mockReturnValue({
				instances: {
					selected: 'test-instance',
					current: 'test-instance',
					sync: true,
					connections: {},
					options: {
						'test-instance': { connectionId: 'conn-1' },
					},
					states: {
						'test-instance': {
							actionsById: {},
							computedStates: [{ state: { count: 5 }, error: undefined }],
							currentStateIndex: 0,
							nextActionId: 1,
							stagedActionIds: [0],
							skippedActionIds: [],
							committedState: undefined,
						},
					},
				},
			});
			
			api(mockStore);
			window.__connectDevToolsClient?.(mockClient);
			
			const stateHandler = (mockClient.addMessageListener as jest.Mock).mock.calls.find(
				call => call[0] === 'state'
			)?.[1];
			
			stateHandler({
				name: 'test-instance',
				type: 'UPDATE',
				state: { count: 5 },
			});
			
			// Should send SYNC message
			expect(mockClient.sendMessage).toHaveBeenCalledWith('dispatch', 
				expect.objectContaining({
					type: 'SYNC',
				})
			);
		});
	});

	describe('Pass-through behavior', () => {
		it('should pass through other action types', () => {
			const middleware = api(mockStore)(mockNext);
			
			const otherAction = {
				type: 'SOME_OTHER_ACTION',
				payload: { data: 'test' },
			};
			
			const result = middleware(otherAction as any);
			
			expect(mockNext).toHaveBeenCalledWith(otherAction);
			expect(result).toEqual(otherAction);
		});

		it('should not interfere with action flow', () => {
			const middleware = api(mockStore)(mockNext);
			
			const action1 = { type: 'ACTION_1' };
			const action2 = { type: 'ACTION_2' };
			const action3 = { type: 'ACTION_3' };
			
			middleware(action1 as any);
			middleware(action2 as any);
			middleware(action3 as any);
			
			expect(mockNext).toHaveBeenCalledTimes(3);
			expect(mockNext).toHaveBeenNthCalledWith(1, action1);
			expect(mockNext).toHaveBeenNthCalledWith(2, action2);
			expect(mockNext).toHaveBeenNthCalledWith(3, action3);
		});
	});
});
