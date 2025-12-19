# Zustand Expo DevTools

A DevTools plugin that brings Zustand state debugging capabilities to Expo DevTools, allowing you to inspect and debug your Zustand stores directly in the Expo development environment. This plugin works exactly like the built-in Zustand devtools middleware, with the same API and functionality.

## Features

- 🔍 **State Inspection** - View your Zustand store state in real-time
- 🎯 **Action Tracking** - Monitor state changes and actions with named actions
- 🔄 **Time Travel Debugging** - Navigate through state history using Redux DevTools
- 🚀 **Expo Integration** - Seamlessly integrates with Expo DevTools platform
- 📱 **React Native Support** - Works with Expo managed workflow
- 🌐 **Redux DevTools Core** - Leverages Redux DevTools app core for state inspection
- 🏗️ **TypeScript Support** - Full TypeScript support with proper type definitions
- ⚡ **Production Safe** - Automatically disabled in production builds

## Installation

```bash
npm install @csark0812/zustand-expo-devtools
# or
yarn add @csark0812/zustand-expo-devtools
# or
pnpm add @csark0812/zustand-expo-devtools
```

### Accessing DevTools

To access the DevTools interface:
1. Start your Expo development server (`npx expo start`)
2. Open your app in Expo Go or development build
3. Press **Shift+M** in the Expo development menu to open DevTools
4. Navigate to the DevTools plugin to inspect your Zustand stores

## Quick Start

```typescript
import { create } from 'zustand';
import { devtools } from '@csark0812/zustand-expo-devtools';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    {
      name: 'counter-store', // Optional: name your store for better debugging
    }
  )
);
```

## How It Works

This plugin provides the same functionality as Zustand's built-in `devtools` middleware, but integrated with Expo's DevTools platform:

1. **Store Integration**: Wrap your Zustand store with the `devtools` middleware (same API as Zustand's built-in devtools)
2. **Expo DevTools**: Press **Shift+M** in your Expo development menu to open DevTools
3. **DevTools Plugin**: Navigate to the DevTools plugin to inspect your stores
4. **Debug**: Inspect state, track actions, and time-travel through your store's history

## Configuration Options

```typescript
interface DevtoolsOptions {
  name?: string;                 // Store name (default: 'zustand')
  enabled?: boolean;            // Enable/disable devtools (default: true)
  anonymousActionType?: string; // Default action name (default: 'anonymous')
  store?: string;              // Store identifier
  serialize?: boolean | {       // Serialization options for complex objects
    replacer?: (key: string, value: unknown) => unknown;  // Custom serializer
    reviver?: (key: string, value: unknown) => unknown;   // Custom deserializer
    options?: boolean | {       // Additional serialization options
      date?: boolean;
      regex?: boolean;
      undefined?: boolean;
      error?: boolean;
      symbol?: boolean;
      map?: boolean;
      set?: boolean;
      function?: boolean | ((fn: Function) => string);
    };
  };
}
```

### Serialization Options

When your store contains complex objects like `Date`, `Map`, `Set`, or custom classes, you can use the `serialize` option to properly handle them in DevTools:

```typescript
const useStore = create<State>()(
  devtools(
    (set) => ({
      todos: [],
      addTodo: (text) => set((state) => ({
        todos: [...state.todos, {
          id: Date.now().toString(),
          text,
          createdAt: new Date(), // Date object
        }]
      }), false, 'addTodo'),
    }),
    {
      name: 'todo-store',
      serialize: {
        // Custom function to handle Date objects during serialization
        replacer: (key, value) => {
          if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
          }
          return value;
        },
        // Custom function to restore Date objects during deserialization
        reviver: (key, value) => {
          if (value && value.__type === 'Date') {
            return new Date(value.value);
          }
          return value;
        },
      },
    }
  )
);
```

This is particularly useful when using libraries like:
- [superjson](https://github.com/blitz-js/superjson) for automatic serialization
- Custom serialization for Map, Set, dayjs, etc.
- Immer or other state management patterns with complex objects

## Usage with Actions

For better debugging experience, provide action names when updating state:

```typescript
const useStore = create<State>()(
  devtools(
    (set) => ({
      // ... your state
      updateUser: (user) => set({ user }, false, 'updateUser'),
      resetState: () => set(initialState, false, 'resetState'),
    }),
    { name: 'user-store' }
  )
);
```

## Usage with Other Middleware

The plugin works well with other Zustand middleware like `immer` and `persist`:

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devtools } from '@csark0812/zustand-expo-devtools';

const useStore = create<State>()(
  devtools(
    persist(
      immer((set) => ({
        // ... your state and actions
      })),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
      }
    ),
    { name: 'app-store' }
  )
);
```

## Production Builds

The devtools middleware is automatically disabled in production builds, so you don't need to worry about removing it for production.

## Requirements

- Expo SDK 53+
- Zustand 5.0.5+
- React Native / Expo development environment

## Development

This repository contains:
- `/src` - The main devtools plugin source code
- `/webui` - The DevTools web UI that connects to Redux DevTools Extension
- `/examples/basic` - Example Expo app demonstrating usage

To run the example:

```bash
cd examples/basic
npm install
npx expo start
```

To develop the plugin:

```bash
# Install dependencies
npm install

# For development (rebuilds on changes)
npm run build:dev

# Build the plugin
npm run build

# Build the web UI
npm run web:export

# Build everything
npm run build:all
```

**Development Workflow**: After making changes to the plugin source code, run `npm run build:dev` in the root folder to rebuild the library. This will update the compiled code that the example app uses for testing your changes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Automated Releases

This repository uses automated versioning and publishing when PRs are merged to `main`. The version bump type is determined by PR labels:

- **`major`** label → Major version bump (e.g., 2.0.0 → 3.0.0) - Breaking changes
- **`minor`** label → Minor version bump (e.g., 2.0.0 → 2.1.0) - New features  
- **`patch`** label → Patch version bump (e.g., 2.0.0 → 2.0.1) - Bug fixes (default)

To control the release type:
1. Add the appropriate label (`major`, `minor`, or `patch`) to your PR
2. If no label is added, it defaults to a `patch` release
3. When the PR is merged, the version will be automatically bumped and published to npm

## License

MIT © [Christopher Sarkissian](https://github.com/csark0812)

## Related

- [Zustand](https://github.com/pmndrs/zustand) - 🐻 Bear necessities for state management in React
- [Expo DevTools](https://docs.expo.dev/debugging/tools/) - Expo's debugging and profiling tools
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - DevTools core integration

## Inspiration & Credits

This project was inspired by:
- [redux-devtools-expo-dev-plugin](https://github.com/matt-oakes/redux-devtools-expo-dev-plugin) - Redux DevTools integration for Expo
- [zustand-expo-devtools](https://github.com/jhonny1525/zustand-expo-devtools) - Previous Zustand DevTools implementation

Built using:
- [Expo DevTools Plugins](https://docs.expo.dev/debugging/devtools-plugins/) - Expo's DevTools plugin architecture
