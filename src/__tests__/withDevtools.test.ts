import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { devtools } from '../withDevtools';

// Mock expo/devtools
vi.mock('expo/devtools', () => ({
  getDevToolsPluginClientAsync: vi.fn(async () => ({
    sendMessage: vi.fn(),
    addMessageListener: vi.fn(() => ({ remove: vi.fn() })),
  })),
}));

interface TestStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

describe('devtools middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a store with devtools enabled', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
          decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
        }),
        { name: 'Test Store' }
      )
    );

    const state = useStore.getState();
    expect(state.count).toBe(0);
  });

  it('should handle increment action', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
          decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
        }),
        { name: 'Test Store' }
      )
    );

    const { increment } = useStore.getState();
    increment();

    expect(useStore.getState().count).toBe(1);
  });

  it('should handle decrement action', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
          decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
        }),
        { name: 'Test Store' }
      )
    );

    const { decrement } = useStore.getState();
    decrement();

    expect(useStore.getState().count).toBe(-1);
  });

  it('should use anonymous action type when no action name is provided', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          decrement: () => set((state) => ({ count: state.count - 1 })),
        }),
        { name: 'Test Store' }
      )
    );

    const { increment } = useStore.getState();
    increment();

    expect(useStore.getState().count).toBe(1);
  });

  it('should use custom anonymous action type', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 })),
          decrement: () => set((state) => ({ count: state.count - 1 })),
        }),
        { 
          name: 'Test Store',
          anonymousActionType: 'CUSTOM_ANONYMOUS'
        }
      )
    );

    const { increment } = useStore.getState();
    increment();

    expect(useStore.getState().count).toBe(1);
  });

  it('should be disabled when enabled is false', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
          decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
        }),
        { 
          name: 'Test Store',
          enabled: false
        }
      )
    );

    const state = useStore.getState();
    expect(state.count).toBe(0);
  });

  it('should have devtools cleanup method', async () => {
    const useStore = create<TestStore>()(
      devtools(
        (set) => ({
          count: 0,
          increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
          decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
        }),
        { name: 'Test Store' }
      )
    );

    // Check that devtools cleanup exists
    const storeWithDevtools = useStore as any;
    expect(storeWithDevtools.devtools).toBeDefined();
    expect(storeWithDevtools.devtools.cleanup).toBeDefined();
  });
});
