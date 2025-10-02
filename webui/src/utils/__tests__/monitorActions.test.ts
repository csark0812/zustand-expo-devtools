/**
 * Tests for webui/src/utils/monitorActions.ts
 * Tests the non-Redux dispatch utility for handling Zustand state
 */

import type { DispatchAction, InstancesState } from '@redux-devtools/app-core';
import type { Dispatch, MiddlewareAPI } from 'redux';
import type { StoreAction } from '../../actions';
import type { StoreState } from '../../reducers';
import { nonReduxDispatch } from '../monitorActions';

describe('monitorActions.ts - nonReduxDispatch utility', () => {
	let mockStore: MiddlewareAPI<Dispatch<StoreAction>, StoreState>;
	let mockGetState: jest.Mock;
	let mockDispatch: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		
		mockGetState = jest.fn();
		mockDispatch = jest.fn();
		
		mockStore = {
			getState: mockGetState,
			dispatch: mockDispatch,
		};
	});

	describe('Basic functionality', () => {
		it('should return stringified state for non-DISPATCH messages', () => {
			const state = { count: 0, name: 'test' };
			const action = { type: 'JUMP_TO_STATE', index: 0 } as DispatchAction;
			
			const result = nonReduxDispatch(
				mockStore,
				'ACTION',
				'test-instance',
				action,
				state
			);
			
			expect(result).toBe(JSON.stringify(state));
		});

		it('should handle DISPATCH message type', () => {
			const state = { count: 5, name: 'dispatch-test' };
			const action = { type: 'JUMP_TO_STATE', index: 0 } as DispatchAction;
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				'test-instance',
				action,
				state
			);
			
			expect(typeof result).toBe('string');
		});

		it('should return stringified state for different state types', () => {
			const states = [
				{ simple: 'object' },
				{ nested: { deep: { value: 42 } } },
				{ array: [1, 2, 3] },
				{ mixed: { num: 1, str: 'test', arr: [1, 2], obj: { a: 1 } } },
			];
			
			states.forEach(state => {
				const result = nonReduxDispatch(
					mockStore,
					'ACTION',
					'test-instance',
					{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
					state
				);
				
				expect(result).toBe(JSON.stringify(state));
				expect(JSON.parse(result as string)).toEqual(state);
			});
		});
	});

	describe('DISPATCH message handling', () => {
		it('should extract state from instances for DISPATCH messages', () => {
			const instanceId = 'my-store';
			const currentState = { count: 10 };
			
			const instances: Partial<InstancesState> = {
				states: {
					[instanceId]: {
						actionsById: {},
						computedStates: [
							{ state: currentState, error: undefined },
						],
						currentStateIndex: 0,
						nextActionId: 1,
						stagedActionIds: [0],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				instanceId,
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				{},
				instances as InstancesState
			);
			
			expect(result).toBe(JSON.stringify(currentState));
		});

		it('should handle ROLLBACK action type', () => {
			const instanceId = 'rollback-store';
			const initialState = { count: 0 };
			const currentState = { count: 5 };
			
			const instances: Partial<InstancesState> = {
				states: {
					[instanceId]: {
						actionsById: {},
						computedStates: [
							{ state: initialState, error: undefined },
							{ state: currentState, error: undefined },
						],
						currentStateIndex: 1,
						nextActionId: 2,
						stagedActionIds: [0, 1],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				instanceId,
				{ type: 'ROLLBACK', timestamp: Date.now() } as DispatchAction,
				{},
				instances as InstancesState
			);
			
			// Should return the first state (index 0) for rollback
			expect(result).toBe(JSON.stringify(initialState));
		});

		it('should use currentStateIndex for non-ROLLBACK actions', () => {
			const instanceId = 'indexed-store';
			const states = [
				{ count: 0 },
				{ count: 1 },
				{ count: 2 },
			];
			
			const instances: Partial<InstancesState> = {
				states: {
					[instanceId]: {
						actionsById: {},
						computedStates: states.map(state => ({ state, error: undefined })),
						currentStateIndex: 1, // Point to middle state
						nextActionId: 3,
						stagedActionIds: [0, 1, 2],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				instanceId,
				{ type: 'JUMP_TO_STATE', index: 1 } as DispatchAction,
				{},
				instances as InstancesState
			);
			
			expect(result).toBe(JSON.stringify(states[1]));
		});

		it('should handle nested state property', () => {
			const instanceId = 'nested-store';
			const innerState = { value: 42 };
			
			const instances: Partial<InstancesState> = {
				states: {
					[instanceId]: {
						actionsById: {},
						computedStates: [
							{ state: { state: innerState }, error: undefined },
						],
						currentStateIndex: 0,
						nextActionId: 1,
						stagedActionIds: [0],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				instanceId,
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				{},
				instances as InstancesState
			);
			
			expect(result).toBe(JSON.stringify(innerState));
		});

		it('should fallback to computed state if no nested state property', () => {
			const instanceId = 'fallback-store';
			const directState = { direct: true };
			
			const instances: Partial<InstancesState> = {
				states: {
					[instanceId]: {
						actionsById: {},
						computedStates: [
							{ state: directState, error: undefined },
						],
						currentStateIndex: 0,
						nextActionId: 1,
						stagedActionIds: [0],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				instanceId,
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				{},
				instances as InstancesState
			);
			
			expect(result).toBe(JSON.stringify(directState));
		});
	});

	describe('Edge cases', () => {
		it('should handle missing instances parameter', () => {
			const state = { count: 0 };
			
			const result = nonReduxDispatch(
				mockStore,
				'ACTION',
				'test-instance',
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				state,
				undefined
			);
			
			expect(result).toBe(JSON.stringify(state));
		});

		it('should handle missing instance states', () => {
			const state = { count: 0 };
			const instances: Partial<InstancesState> = {
				states: {},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				'non-existent-instance',
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				state,
				instances as InstancesState
			);
			
			// When instance doesn't exist, it falls back to the provided state
			expect(result).toBe(JSON.stringify(state));
		});

		it('should handle empty computed states', () => {
			const instanceId = 'empty-store';
			const instances: Partial<InstancesState> = {
				states: {
					[instanceId]: {
						actionsById: {},
						computedStates: [],
						currentStateIndex: 0,
						nextActionId: 0,
						stagedActionIds: [],
						skippedActionIds: [],
						committedState: undefined,
					},
				},
			};
			
			const result = nonReduxDispatch(
				mockStore,
				'DISPATCH',
				instanceId,
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				{},
				instances as InstancesState
			);
			
			expect(result).toBe(JSON.stringify(undefined));
		});

		it('should handle numeric instance IDs', () => {
			const instanceId = 123;
			const state = { count: 0 };
			
			const result = nonReduxDispatch(
				mockStore,
				'ACTION',
				instanceId,
				{ type: 'JUMP_TO_STATE', index: 0 } as DispatchAction,
				state
			);
			
			expect(result).toBe(JSON.stringify(state));
		});

		it('should handle different action types', () => {
			const state = { value: 'test' };
			const actionTypes: DispatchAction[] = [
				{ type: 'ROLLBACK', timestamp: Date.now() },
				{ type: 'JUMP_TO_STATE', index: 0 },
				{ type: 'JUMP_TO_ACTION', actionId: 1 },
				{ type: 'TOGGLE_ACTION', id: 1 },
				{ type: 'PAUSE_RECORDING', status: true },
			];
			
			actionTypes.forEach(action => {
				const result = nonReduxDispatch(
					mockStore,
					'DISPATCH',
					'test-instance',
					action,
					state
				);
				
				expect(typeof result).toBe('string');
			});
		});
	});
});
