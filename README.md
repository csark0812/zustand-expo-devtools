# Zustand Expo DevTools

A DevTools plugin that brings Zustand state debugging capabilities to Expo DevTools, allowing you to inspect and debug your Zustand stores directly in the Expo development environment using the Redux DevTools browser extension.

## Features

- 🔍 **State Inspection** - View your Zustand store state in real-time
- 🎯 **Action Tracking** - Monitor state changes and actions with named actions
- 🔄 **Time Travel Debugging** - Navigate through state history using Redux DevTools
- 🚀 **Expo Integration** - Seamlessly integrates with Expo DevTools platform
- 📱 **React Native Support** - Works with Expo managed workflow
- 🌐 **Redux DevTools Extension** - Leverages the popular Redux DevTools browser extension
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

### Prerequisites

- Redux DevTools browser extension ([Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/))

## Quick Start

```typescript
import { create } from 'zustand';
import { expoDevtools } from '@csark0812/zustand-expo-devtools';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterState>()(
  expoDevtools(
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

1. **Store Integration**: Wrap your Zustand store with the `expoDevtools` middleware
2. **Expo DevTools**: Open Expo DevTools in your browser during development
3. **Redux DevTools**: The plugin automatically connects to the Redux DevTools browser extension
4. **Debug**: Inspect state, track actions, and time-travel through your store's history

## Configuration Options

```typescript
interface ExpoDevtoolsOptions {
  name?: string;                 // Store name (default: 'zustand')
  enabled?: boolean;            // Enable/disable devtools (default: true)
  anonymousActionType?: string; // Default action name (default: 'anonymous')
  store?: string;              // Store identifier
}
```

## Usage with Actions

For better debugging experience, provide action names when updating state:

```typescript
const useStore = create<State>()(
  expoDevtools(
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
import { expoDevtools } from '@csark0812/zustand-expo-devtools';

const useStore = create<State>()(
  expoDevtools(
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
- Redux DevTools browser extension for debugging

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

# Build the plugin
npm run build

# Build the web UI
npm run web:export

# Build everything
npm run build:all
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Christopher Sarkissian](https://github.com/csark0812)

## Related

- [Zustand](https://github.com/pmndrs/zustand) - 🐻 Bear necessities for state management in React
- [Expo DevTools](https://docs.expo.dev/debugging/devtools/) - Expo's built-in debugging tools
- [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools) - Browser extension for debugging Redux

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related

- [Zustand](https://github.com/pmndrs/zustand) - The state management library
- [Expo DevTools](https://docs.expo.dev/debugging/devtools/) - Expo's debugging tools
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - Inspiration for this project
