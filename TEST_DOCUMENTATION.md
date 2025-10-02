# Test Suite Documentation

This document describes the comprehensive test suite for the zustand-expo-devtools package.

## Overview

The test suite provides comprehensive coverage for:
- Main devtools middleware (`src/withDevtools.ts`)
- Conditional export logic (`src/index.ts`)
- WebUI Redux middleware (`webui/src/middlewares/api.ts`)
- WebUI utility functions (`webui/src/utils/monitorActions.ts`)
- WebUI reducers (`webui/src/reducers/index.ts`)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Structure

### 1. `src/__tests__/index.test.ts`
Tests the conditional devtools export based on NODE_ENV:
- ✅ Exports devtools middleware in development
- ✅ Exports devtools middleware in test environment
- ✅ Exports pass-through function in production

### 2. `src/__tests__/withDevtools.test.ts`
Tests the core Expo DevTools middleware for Zustand:

**Basic functionality:**
- ✅ Creates middleware that returns initial state
- ✅ Initializes Expo DevTools client
- ✅ Sends init message after client initialization

**Options handling:**
- ✅ Uses custom store name from options
- ✅ Disables devtools when enabled is false
- ✅ Uses custom anonymousActionType

**setState override:**
- ✅ Overrides setState to track actions
- ✅ Sends state updates when setState is called
- ✅ Handles string action names
- ✅ Handles object actions
- ✅ Handles anonymous actions (no action name)

**DevTools message handling:**
- ✅ Adds message listener for dispatch events
- ✅ Handles RESET action from devtools
- ✅ Handles JUMP_TO_STATE action
- ✅ Handles PAUSE_RECORDING action

**Error handling:**
- ✅ Handles JSON parse errors gracefully
- ✅ Handles client initialization failure

**Cleanup:**
- ✅ Adds cleanup method to API
- ✅ Allows cleanup without errors

### 3. `webui/src/utils/__tests__/monitorActions.test.ts`
Tests the non-Redux dispatch utility:

**Basic functionality:**
- ✅ Returns stringified state for non-DISPATCH messages
- ✅ Handles DISPATCH message type
- ✅ Handles different state types (objects, arrays, nested)

**DISPATCH message handling:**
- ✅ Extracts state from instances
- ✅ Handles ROLLBACK action type
- ✅ Uses currentStateIndex for non-ROLLBACK actions
- ✅ Handles nested state property
- ✅ Fallbacks to computed state if no nested state

**Edge cases:**
- ✅ Handles missing instances parameter
- ✅ Handles missing instance states
- ✅ Handles empty computed states
- ✅ Handles numeric instance IDs
- ✅ Handles different action types

### 4. `webui/src/middlewares/__tests__/api.test.ts`
Tests the Redux middleware that connects to Expo DevTools:

**Middleware setup:**
- ✅ Creates middleware function
- ✅ Registers connect function on window
- ✅ Returns next middleware function

**EMIT action handling:**
- ✅ Emits message when client is connected
- ✅ Does not emit when client is not connected
- ✅ Calls next with the action
- ✅ Emits with action and state

**LIFTED_ACTION handling:**
- ✅ Dispatches remote action
- ✅ Handles toAll flag

**Client connection:**
- ✅ Adds message listeners on connect
- ✅ Dispatches START on connect
- ✅ Handles init message
- ✅ Handles state update message
- ✅ Handles ping message
- ✅ Uses default store name if not provided

**Monitoring requests:**
- ✅ Syncs state when instances.sync is true

**Pass-through behavior:**
- ✅ Passes through other action types
- ✅ Does not interfere with action flow

### 5. `webui/src/reducers/__tests__/index.test.ts`
Tests the root reducer combining core reducers:

**Reducer structure:**
- ✅ Exports rootReducer function
- ✅ Has initial state structure
- ✅ Includes core reducers

**State management:**
- ✅ Returns current state for unknown actions
- ✅ Handles state updates
- ✅ Maintains immutability

**Integration with core reducers:**
- ✅ Properly combines all core reducers
- ✅ Handles all state slices (instances, monitor, notification, section, theme)

**Reducer composition:**
- ✅ Properly delegates to sub-reducers
- ✅ Maintains independent state slices

**Type safety:**
- ✅ Enforces StoreState type
- ✅ Extends CoreStoreState

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Preset:** `ts-jest` for TypeScript support
- **Test environment:** Node.js
- **Test match:** `**/__tests__/**/*.test.ts(x)`
- **Coverage:** Collects from `src/**/*.ts` and `webui/src/**/*.ts`
- **Module mapper:** Mocks `expo/devtools` module

### Mocks

#### `__mocks__/expo-devtools.ts`
Mocks the Expo DevTools client for testing:
- Provides mock `getDevToolsPluginClientAsync` function
- Returns mock client with `sendMessage` and `addMessageListener` methods

### Setup (`jest.setup.js`)
- Suppresses console logs during tests
- Provides clean test environment

## Coverage Goals

The test suite aims for:
- **Line coverage:** 90%+
- **Branch coverage:** 85%+
- **Function coverage:** 90%+
- **Statement coverage:** 90%+

## Adding New Tests

When adding new features:

1. Create test file in `__tests__` directory next to source file
2. Follow naming convention: `<filename>.test.ts`
3. Group related tests using `describe` blocks
4. Use descriptive test names with `it` or `test`
5. Mock external dependencies
6. Test happy paths, edge cases, and error scenarios
7. Ensure tests are isolated and independent

## Continuous Integration

Tests should be run:
- Before committing code
- In CI/CD pipeline
- Before creating pull requests
- Before releases

## Troubleshooting

### Tests failing due to async operations
- Use `await` with proper async/await patterns
- Add appropriate timeouts for async operations
- Use `jest.useFakeTimers()` if needed

### Mock issues
- Ensure mocks are properly reset with `jest.clearAllMocks()` in `beforeEach`
- Use `jest.resetModules()` when testing module-level code
- Verify mock implementations match actual API

### Type errors
- Ensure test dependencies are properly installed
- Check that TypeScript configuration is correct
- Use proper type assertions when needed

## Resources

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Library](https://testing-library.com/)
- [Zustand Testing Guide](https://docs.pmnd.rs/zustand/guides/testing)
