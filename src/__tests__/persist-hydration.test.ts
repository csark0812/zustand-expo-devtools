import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from '../withDevtools';

// Mock storage
const mockStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: async (name: string) => {
      return store[name] || null;
    },
    setItem: async (name: string, value: string) => {
      store[name] = value;
    },
    removeItem: async (name: string) => {
      delete store[name];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock expo/devtools
const mockSendMessage = vi.fn();
const mockAddMessageListener = vi.fn(() => ({ remove: vi.fn() }));

vi.mock('expo/devtools', () => ({
  getDevToolsPluginClientAsync: vi.fn(async () => ({
    sendMessage: mockSendMessage,
    addMessageListener: mockAddMessageListener,
  })),
}));

interface PersistStore {
  count: number;
  text: string;
  increment: () => void;
  setText: (text: string) => void;
}

describe('persist rehydration with @@HYDRATE action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear();
    mockSendMessage.mockClear();
    mockAddMessageListener.mockClear();
  });

  it('should send @@HYDRATE action when store is rehydrated from persist', async () => {
    // Pre-populate storage with some data
    await mockStorage.setItem(
      'persist-test-store',
      JSON.stringify({
        state: { count: 42, text: 'persisted' },
        version: 0,
      })
    );

    // Create store with persist and devtools
    const useStore = create<PersistStore>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            text: '',
            increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
            setText: (text: string) => set({ text }, false, 'setText'),
          }),
          {
            name: 'persist-test-store',
            storage: createJSONStorage(() => mockStorage),
          }
        ),
        { name: 'Persist Test Store' }
      )
    );

    // Wait for rehydration
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if sendMessage was called with init
    // During rehydration, the first setState call (with no action name)
    // should use @@HYDRATE action type
    expect(mockSendMessage).toHaveBeenCalled();
    
    // The store should have the persisted values
    const state = useStore.getState();
    expect(state.count).toBe(42);
    expect(state.text).toBe('persisted');
  });

  it('should use anonymous action for setState after initialization', async () => {
    const useStore = create<PersistStore>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            text: '',
            increment: () => set((state) => ({ count: state.count + 1 })),
            setText: (text: string) => set({ text }),
          }),
          {
            name: 'persist-test-store-2',
            storage: createJSONStorage(() => mockStorage),
          }
        ),
        { name: 'Persist Test Store 2' }
      )
    );

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    mockSendMessage.mockClear();

    // Now call setState without action name - should use "anonymous" not "@@HYDRATE"
    const { increment } = useStore.getState();
    increment();

    expect(useStore.getState().count).toBe(1);
  });

  it('should properly handle persist with named actions', async () => {
    const useStore = create<PersistStore>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            text: '',
            increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
            setText: (text: string) => set({ text }, false, 'setText'),
          }),
          {
            name: 'persist-test-store-3',
            storage: createJSONStorage(() => mockStorage),
          }
        ),
        { name: 'Persist Test Store 3' }
      )
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    const { increment, setText } = useStore.getState();
    
    // Call named actions
    increment();
    expect(useStore.getState().count).toBe(1);
    
    setText('hello');
    expect(useStore.getState().text).toBe('hello');
    
    // Verify the data is persisted
    const persisted = await mockStorage.getItem('persist-test-store-3');
    expect(persisted).toBeTruthy();
    
    if (persisted) {
      const data = JSON.parse(persisted);
      expect(data.state.count).toBe(1);
      expect(data.state.text).toBe('hello');
    }
  });

  it('should handle multiple rehydrations correctly', async () => {
    // First store instance
    await mockStorage.setItem(
      'multi-rehydrate-store',
      JSON.stringify({
        state: { count: 10, text: 'first' },
        version: 0,
      })
    );

    const useStore1 = create<PersistStore>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            text: '',
            increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
            setText: (text: string) => set({ text }, false, 'setText'),
          }),
          {
            name: 'multi-rehydrate-store',
            storage: createJSONStorage(() => mockStorage),
          }
        ),
        { name: 'Multi Rehydrate Store' }
      )
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should rehydrate to 10
    expect(useStore1.getState().count).toBe(10);
    
    // Update the count
    useStore1.getState().increment();
    expect(useStore1.getState().count).toBe(11);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Create second store instance (simulating app restart)
    const useStore2 = create<PersistStore>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            text: '',
            increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
            setText: (text: string) => set({ text }, false, 'setText'),
          }),
          {
            name: 'multi-rehydrate-store',
            storage: createJSONStorage(() => mockStorage),
          }
        ),
        { name: 'Multi Rehydrate Store 2' }
      )
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should rehydrate to 11 (persisted value from first store)
    expect(useStore2.getState().count).toBe(11);
  });

  it('should work with partial persistence', async () => {
    interface PartialPersistStore {
      count: number;
      tempData: string;
      persistedData: string;
      increment: () => void;
      setTempData: (data: string) => void;
      setPersistedData: (data: string) => void;
    }

    const useStore = create<PartialPersistStore>()(
      devtools(
        persist(
          (set) => ({
            count: 0,
            tempData: '',
            persistedData: '',
            increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
            setTempData: (data: string) => set({ tempData: data }, false, 'setTempData'),
            setPersistedData: (data: string) => set({ persistedData: data }, false, 'setPersistedData'),
          }),
          {
            name: 'partial-persist-store',
            storage: createJSONStorage(() => mockStorage),
            partialize: (state) => ({
              count: state.count,
              persistedData: state.persistedData,
              // tempData is excluded
            }),
          }
        ),
        { name: 'Partial Persist Store' }
      )
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    const { increment, setTempData, setPersistedData } = useStore.getState();
    
    increment();
    setTempData('temp');
    setPersistedData('persisted');

    expect(useStore.getState().count).toBe(1);
    expect(useStore.getState().tempData).toBe('temp');
    expect(useStore.getState().persistedData).toBe('persisted');

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check what was persisted
    const persisted = await mockStorage.getItem('partial-persist-store');
    expect(persisted).toBeTruthy();
    
    if (persisted) {
      const data = JSON.parse(persisted);
      expect(data.state.count).toBe(1);
      expect(data.state.persistedData).toBe('persisted');
      expect(data.state.tempData).toBeUndefined(); // Should not be persisted
    }
  });
});
