# Onboarding Store Anonymous State Updates - Solution

## Problem Analysis

### 1. Multiple Anonymous State Updates
**Root Cause**: The `persist` middleware triggers state updates during rehydration without action names. When `setState` is called without the third parameter (action name), the devtools middleware labels it as "anonymous" or "@@HYDRATE".

**Why Multiple Updates?**
- Initial store creation triggers one update
- Persist middleware rehydration triggers another
- Each subsequent state change without an action name triggers more

### 2. Stale Data (`isThirdParty`, `newUserHasCredentials`)
**Root Cause**: AsyncStorage contains old persisted data from a previous version of your store schema. When the persist middleware rehydrates, it loads ALL data from storage, including fields that no longer exist in your TypeScript interface.

### 3. Why This Happens
From the devtools implementation (`withDevtools.ts:316-331`):
```typescript
const createAction = (nameOrAction?: Action): { type: string } => {
    if (nameOrAction === undefined) {
        if (!isInitialized) {
            return { type: "@@HYDRATE" };
        }
        return { type: anonymousActionType || "anonymous" };
    }
    // ...
};
```

When persist rehydrates without an action name, it gets logged as "anonymous".

## Solution Breakdown

### 1. **Version Control & Migration** (Lines 144-158)
```typescript
version: 1,
migrate: (persistedState: any, version: number) => {
  if (version === 0) {
    const {
      isThirdParty,           // Remove stale field
      newUserHasCredentials,  // Remove stale field
      ...validState
    } = persistedState;
    return validState as OnboardingState;
  }
  return persistedState as OnboardingState;
},
```

**What it does:**
- Adds version tracking to your persisted state
- When loading old data (version 0), strips out `isThirdParty` and `newUserHasCredentials`
- Future schema changes can be handled by incrementing the version

### 2. **Partialize Function** (Lines 160-171)
```typescript
partialize: (state) => ({
  name: state.name,
  jobTitle: state.jobTitle,
  company: state.company,
  phoneNumber: state.phoneNumber,
  email: state.email,
  password: state.password,
  image: state.image,
  currentStep: state.currentStep,
  hasIncompleteOnboarding: state.hasIncompleteOnboarding,
}),
```

**What it does:**
- Explicitly defines which fields get persisted to AsyncStorage
- Prevents action functions from being saved
- Ensures only valid fields are stored (no stale data can be saved)

### 3. **Custom Merge Function** (Lines 177-198)
```typescript
merge: (persistedState, currentState) => {
  const validFields: (keyof OnboardingFormData)[] = [
    'name', 'jobTitle', 'company', 'phoneNumber',
    'email', 'password', 'image', 'currentStep',
    'hasIncompleteOnboarding',
  ];
  
  const filteredPersistedState: Partial<OnboardingState> = {};
  validFields.forEach((field) => {
    if (field in persistedState) {
      filteredPersistedState[field] = persistedState[field];
    }
  });
  
  return {
    ...currentState,
    ...filteredPersistedState,
  };
},
```

**What it does:**
- Provides a whitelist of valid fields
- Filters out any unknown fields during rehydration
- Ensures stale data never makes it into your store

### 4. **Custom Anonymous Action Type** (Lines 204-206)
```typescript
{ 
  name: 'onboarding-store',
  anonymousActionType: '@@REHYDRATE',
}
```

**What it does:**
- Changes the anonymous action label from "anonymous" to "@@REHYDRATE"
- Makes it clearer in devtools when rehydration is happening
- Helps distinguish persist rehydration from other anonymous updates

## Expected DevTools Logs After Fix

```
[DevTools] Received init message: {name: 'onboarding-store', state: {...}}
[DevTools] Processing monitoring request: {type: 'INIT', ...}
[DevTools] Received state update: {name: 'onboarding-store', type: '@@REHYDRATE', state: {...}}
// No stale fields (isThirdParty, newUserHasCredentials)
// Only ONE rehydration event
```

## Migration Steps

1. **Clear Existing Storage (Recommended for Development)**
   ```typescript
   // Add this temporarily to your app initialization
   AsyncStorage.removeItem('onboarding-storage');
   ```

2. **Replace Your Store Configuration**
   - Copy the fixed version from `onboarding-store-fixed.ts`
   - Replace your current persist configuration

3. **Test the Changes**
   - Clear the app data/cache
   - Launch the app and check devtools
   - Verify only valid fields are present
   - Confirm single rehydration event

## Future Schema Changes

When you need to add/remove fields:

1. **Increment the version**:
   ```typescript
   version: 2,
   ```

2. **Add migration logic**:
   ```typescript
   migrate: (persistedState: any, version: number) => {
     if (version === 0) {
       // Handle v0 -> v1 migration
       const { isThirdParty, newUserHasCredentials, ...validState } = persistedState;
       return validState;
     }
     if (version === 1) {
       // Handle v1 -> v2 migration
       return {
         ...persistedState,
         newField: 'default value',
       };
     }
     return persistedState;
   },
   ```

3. **Update partialize and merge**:
   - Add new fields to the `partialize` return object
   - Add new fields to the `validFields` array in `merge`

## Additional Recommendations

1. **Never store sensitive data like passwords in AsyncStorage** - Use secure storage like `expo-secure-store` for sensitive data

2. **Consider splitting state** - If you have different persistence needs, consider separate stores:
   - One for form data (persisted)
   - One for UI state (not persisted)

3. **Add error handling** - Wrap your store usage in try-catch blocks to handle corruption

4. **Use TypeScript strictly** - The type system helps catch schema mismatches early

## Why You Had Multiple Anonymous Updates

The persist middleware was:
1. Rehydrating state without action names → "anonymous" 
2. Loading stale fields from AsyncStorage → old schema data
3. Potentially rehydrating multiple times due to component mounting

The fix ensures:
1. Only valid fields are persisted and loaded
2. Stale data is stripped during migration
3. Rehydration events are clearly labeled as "@@REHYDRATE"
