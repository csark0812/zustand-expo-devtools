# Zustand Store with Immer & AsyncStorage

This store demonstrates a complete setup of Zustand with Immer middleware for immutable updates and persist middleware using @react-native-async-storage/async-storage for reliable persistence.

## Features

- **Zustand**: Lightweight state management
- **Immer**: Immutable state updates with mutable syntax
- **AsyncStorage**: Reliable, cross-platform key-value storage for React Native
- **TypeScript**: Full type safety
- **Optimized Selectors**: Prevent unnecessary re-renders

## Store Structure

The store includes three main sections:

### 1. Counter State
```typescript
// State
count: number

// Actions
increment: () => void
decrement: () => void
reset: () => void
```

### 2. User Preferences
```typescript
// State
preferences: {
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  language: string
}

// Actions
updatePreferences: (preferences: Partial<AppState['preferences']>) => void
```

### 3. Todo List
```typescript
// State
todos: Array<{
  id: string
  text: string
  completed: boolean
  createdAt: Date
}>

// Actions
addTodo: (text: string) => void
toggleTodo: (id: string) => void
removeTodo: (id: string) => void
```

## Usage Examples

### Basic Usage
```typescript
import { useAppStore } from '@/store';

function MyComponent() {
  const count = useAppStore(state => state.count);
  const increment = useAppStore(state => state.increment);
  
  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
}
```

### Optimized Selectors
```typescript
import { useCount, useCountActions } from '@/store';

function OptimizedCounter() {
  const count = useCount(); // Only re-renders when count changes
  const { increment, decrement, reset } = useCountActions(); // Stable references
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Immer Updates
```typescript
// With Immer, you can write "mutative" logic that's actually immutable
addTodo: (text) =>
  set((state) => {
    state.todos.push({
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date(),
    });
  }),
```

## Persistence

All state is automatically persisted to AsyncStorage and will survive app restarts. You can customize what gets persisted using the `partialize` option:

```typescript
partialize: (state) => ({
  count: state.count,
  preferences: state.preferences,
  todos: state.todos,
}),
```

## AsyncStorage Adapter

The store uses a custom AsyncStorage adapter that provides:
- Asynchronous storage operations
- Cross-platform compatibility (iOS, Android, Web)
- Error handling and logging
- Reliable persistence

## Adding New State

To add new state to the store:

1. Update the `AppState` interface
2. Add the state and actions in the store creation
3. Optionally create optimized selectors
4. Update the `partialize` function if you want it persisted

Example:
```typescript
// 1. Update interface
export interface AppState {
  // ... existing state
  newFeature: {
    data: string[]
    isLoading: boolean
  }
  updateNewFeature: (data: string[]) => void
}

// 2. Add to store
export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // ... existing state
      newFeature: {
        data: [],
        isLoading: false,
      },
      updateNewFeature: (data) =>
        set((state) => {
          state.newFeature.data = data;
          state.newFeature.isLoading = false;
        }),
    })),
    // ... persist config
  )
);

// 3. Create selectors
export const useNewFeature = () => useAppStore((state) => state.newFeature);
export const useUpdateNewFeature = () => useAppStore((state) => state.updateNewFeature);
```

## Best Practices

1. **Use selectors**: Create specific selectors to avoid unnecessary re-renders
2. **Batch updates**: Group related state changes in a single `set` call
3. **Type safety**: Always use TypeScript interfaces for state shape
4. **Partition state**: Only persist what's necessary for better performance
5. **Immer patterns**: Take advantage of Immer's mutable-style updates for complex state
