# Zustand Expo DevTools

A DevTools plugin that brings Zustand state debugging capabilities to Expo DevTools, allowing you to inspect and debug your Zustand stores directly in the Expo development environment.

## Features

- 🔍 **State Inspection** - View your Zustand store state in real-time
- 🎯 **Action Tracking** - Monitor state changes and actions
- 🔄 **Time Travel Debugging** - Navigate through state history
- 🚀 **Expo Integration** - Seamlessly works with Expo DevTools
- 📱 **React Native Support** - Works with both Expo managed and bare workflows

## Installation

```bash
npm install zustand-expo-devtools
# or
yarn add zustand-expo-devtools
# or
pnpm add zustand-expo-devtools
```

## Quick Start

```typescript
import { create } from 'zustand';
import { expoDevtools } from 'zustand-expo-devtools';

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

## Configuration Options

```typescript
interface DevtoolsOptions {
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

## Production Builds

The devtools middleware is automatically disabled in production builds, so you don't need to worry about removing it for production.

## Requirements

- Expo SDK 50+
- Zustand 4.0+
- React Native / Expo development environment

## Development

This repository contains:
- `/plugin` - The main devtools plugin
- `/example` - Example Expo app demonstrating usage

To run the example:

```bash
cd example
npm install
npx expo start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related

- [Zustand](https://github.com/pmndrs/zustand) - The state management library
- [Expo DevTools](https://docs.expo.dev/debugging/devtools/) - Expo's debugging tools
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - Inspiration for this project
