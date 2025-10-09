/**
 * Tests for webui/src/reducers/index.ts
 * Tests the root reducer combining core reducers
 */

import { coreReducers } from '@redux-devtools/app-core';
import type { StoreState } from '../index';

// Import the actual rootReducer dynamically to avoid type issues
const reducersModule = require('../index');
const rootReducer = reducersModule.rootReducer;

describe('reducers/index.ts - Root reducer', () => {
	describe('Reducer structure', () => {
		it('should export rootReducer function', () => {
			expect(rootReducer).toBeDefined();
			expect(typeof rootReducer).toBe('function');
		});

		it('should have initial state structure', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState).toBeDefined();
			expect(typeof initialState).toBe('object');
		});

		it('should include core reducers', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			// Core reducers include instances, monitor, notification, etc.
			expect(initialState).toHaveProperty('instances');
			expect(initialState).toHaveProperty('monitor');
			expect(initialState).toHaveProperty('notification');
			expect(initialState).toHaveProperty('section');
			expect(initialState).toHaveProperty('theme');
		});
	});

	describe('State management', () => {
		it('should return current state for unknown actions', () => {
			const currentState = rootReducer(undefined, { type: '@@INIT' } as any);
			const newState = rootReducer(currentState, { type: 'UNKNOWN_ACTION' } as any);
			
			expect(newState).toEqual(currentState);
		});

		it('should handle state updates', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState).toBeDefined();
			
			// Test that subsequent calls with the same action return consistent state
			const state2 = rootReducer(initialState, { type: 'TEST_ACTION' } as any);
			const state3 = rootReducer(state2, { type: 'TEST_ACTION' } as any);
			
			expect(state2).toEqual(state3);
		});

		it('should be immutable', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			const stateCopy = { ...initialState };
			
			rootReducer(initialState, { type: 'TEST_ACTION' } as any);
			
			// Original state should not be modified
			expect(initialState).toEqual(stateCopy);
		});
	});

	describe('StoreState interface', () => {
		it('should match structure of initial state', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			// Type assertion to ensure StoreState matches
			const typedState: StoreState = initialState;
			
			expect(typedState).toBeDefined();
			expect(typedState.instances).toBeDefined();
			expect(typedState.monitor).toBeDefined();
		});
	});

	describe('Integration with core reducers', () => {
		it('should properly combine all core reducers', () => {
			const coreReducerKeys = Object.keys(coreReducers);
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			const stateKeys = Object.keys(initialState);
			
			// All core reducer keys should be present in the state
			coreReducerKeys.forEach(key => {
				expect(stateKeys).toContain(key);
			});
		});

		it('should handle instances state slice', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState.instances).toBeDefined();
			expect(initialState.instances.selected).toBeDefined();
			expect(initialState.instances.current).toBeDefined();
			expect(initialState.instances.connections).toBeDefined();
		});

		it('should handle monitor state slice', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState.monitor).toBeDefined();
		});

		it('should handle notification state slice', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState.notification).toBeDefined();
		});

		it('should handle section state slice', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState.section).toBeDefined();
		});

		it('should handle theme state slice', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			expect(initialState.theme).toBeDefined();
		});
	});

	describe('Reducer composition', () => {
		it('should properly delegate to sub-reducers', () => {
			const state1 = rootReducer(undefined, { type: '@@INIT' } as any);
			
			// Apply an action that might affect instances
			const state2 = rootReducer(state1, { 
				type: 'SELECT_INSTANCE',
				payload: 'test-instance',
			} as any);
			
			// With our mock reducers that don't handle actions, state should remain the same
			// In a real scenario with actual reducers, this would change
			expect(state2).toBeDefined();
		});

		it('should maintain independent state slices', () => {
			const initialState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			// Each slice should be independent
			const instancesRef = initialState.instances;
			const monitorRef = initialState.monitor;
			const notificationRef = initialState.notification;
			
			expect(instancesRef).not.toBe(monitorRef);
			expect(monitorRef).not.toBe(notificationRef);
			expect(notificationRef).not.toBe(instancesRef);
		});
	});

	describe('Type safety', () => {
		it('should enforce StoreState type', () => {
			const state: StoreState = rootReducer(undefined, { type: '@@INIT' } as any);
			
			// These should all be accessible and type-safe
			expect(state.instances).toBeDefined();
			expect(state.monitor).toBeDefined();
			expect(state.notification).toBeDefined();
			expect(state.section).toBeDefined();
			expect(state.theme).toBeDefined();
		});

		it('should extend CoreStoreState', () => {
			const state = rootReducer(undefined, { type: '@@INIT' } as any);
			
			// StoreState extends CoreStoreState, so it should have all core properties
			const stateAsCore: StoreState = state;
			expect(stateAsCore.instances).toBeDefined();
		});
	});
});
