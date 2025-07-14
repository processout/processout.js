# APM StateManager System

## Overview

The StateManager is a global state management system designed specifically for APM (Alternative Payment Methods) components. It provides a centralized way to manage stateful components that need to trigger re-renders when their state changes.

## Problem it Solves

Before StateManager, stateful components in the APM system had several issues:

1. **Global State Pollution**: Components used module-level state variables that were shared between instances
2. **Manual DOM Manipulation**: State changes required manual DOM updates
3. **No Re-render Triggering**: Components couldn't trigger parent view re-renders
4. **Memory Leaks**: State persisted incorrectly across component lifecycles

## Key Features

- **✅ Stable Component IDs**: Uses first-render call order (React hooks pattern)
- **✅ Automatic Re-renders**: State changes trigger parent view updates
- **✅ Batched Updates**: Multiple setState calls in one frame = single re-render
- **✅ Lifecycle Management**: Automatic cleanup when views unmount
- **✅ Memory Efficient**: Prevents memory leaks with proper cleanup
- **✅ Type Safe**: Full TypeScript support with generic state types
- **✅ Position Independent**: Components maintain state when order changes

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Component A   │    │   Component B   │    │   Component C   │
│   (phone-123)   │    │    (otp-456)    │    │    (qr-789)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │       StateManager       │
                    │   (Singleton Instance)   │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │       APMViewImpl        │
                    │      (Parent View)       │
                    │      forceUpdate()       │
                    └──────────────────────────┘
```

## Basic Usage



### 1. Use state in your component

```typescript
export const Phone = ({ name, ...props }: PhoneProps) => {
  // Simple state management - just pass initial state!
  const { state, setState } = useComponentState({
    dialing_code: '',
    value: '',
    iso: '',
  });
  
  // Update state triggers automatic re-renders
  const handleInputChange = (newValue: string) => {
    setState(prevState => ({ 
      ...prevState, 
      value: newValue 
    }));
  };
  
  return input({
    value: state.value,
    oninput: handleInputChange
  });
};
```

### 2. Use Component in View

```typescript
export class MyView extends APMViewImpl {
  render() {
    return div({ className: 'view' },
      Phone({ 
        name: 'user-phone',
        dialing_codes: [...] 
      })
    );
  }
}
```

## API Reference

### Core Functions

#### `useComponentState<T>(initialState: T)`

Hook for components to use stateful behavior. Automatically generates unique component IDs and detects the current view context.

**Parameters:**
- `initialState`: Initial state object (T)

**Returns:**
```typescript
{
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
      watch: {
      (callback: (state: T) => void): () => void;
      <K extends keyof T>(field: K, callback: (newValue: T[K]) => void): () => void;
    };
}
```

#### `generateComponentId(prefix?)`

Generates a unique component ID.

**Parameters:**
- `prefix`: Optional prefix for the ID (default: 'comp')

**Returns:** Unique string ID

#### `getStateManager()`

Gets the singleton StateManager instance.

**Returns:** StateManager instance

#### `cleanupComponentState(id)`

Manually clean up component state.

**Parameters:**
- `id`: Component ID to clean up

### StateManager Class

#### `registerComponent<T>(id, initialState, view?)`

Register a component with the state manager.

#### `getComponentState<T>(id)`

Get component state by ID.

#### `updateComponentState<T>(id, newState, forceUpdate?)`

Update component state and trigger re-renders.

#### `destroyComponent(id)`

Remove component from state manager.

#### `destroyViewComponents(view)`

Clean up all components associated with a view.

## Migration Guide

### From Global State to StateManager

**Before:**
```typescript
// Global state (problematic)
let phoneState = {
  dialing_code: '',
  value: '',
  iso: ''
};

export const Phone = (props) => {
  const handleChange = (newValue) => {
    phoneState.value = newValue;
    // Manual DOM manipulation required
    updatePhoneDisplay();
  };
  
  return input({ oninput: handleChange });
};
```

**After:**
```typescript
// StateManager (proper state management)
export const Phone = (props) => {
  const { state, setState } = useComponentState({
    dialing_code: '',
    value: '',
    iso: ''
  });
  
  const handleChange = (newValue) => {
    setState(prevState => ({ ...prevState, value: newValue }));
    // Automatic re-render triggered
  };
  
  return input({ 
    value: state.value,
    oninput: handleChange 
  });
};
```

### From Module-level State Stores

**Before:**
```typescript
// Module-level state store
const qrStateStore: Record<string, QRState> = {};

export const QR = ({ id, ...props }) => {
  if (!qrStateStore[id]) {
    qrStateStore[id] = { isDownloading: false };
  }
  
  const state = qrStateStore[id];
  
  // Manual updates
  const handleDownload = () => {
    state.isDownloading = true;
    updateQRDisplay(); // Manual DOM manipulation
  };
};
```

**After:**
```typescript
// StateManager
export const QR = ({ id, ...props }) => {
  const { state, setState } = useComponentState({
    isDownloading: false
  });
  
  const handleDownload = () => {
    setState(prevState => ({ ...prevState, isDownloading: true }));
    // Automatic re-render triggered
  };
};
```

## Best Practices

### 1. Use the Simple API

```typescript
// ✅ Good - simple and automatic
const { state, setState } = useComponentState({ count: 0 });

// Component IDs are automatically generated and stable across re-renders
```

### 2. Define State Interface for Type Safety

```typescript
// ✅ Good - type-safe state management
interface CounterState {
  count: number;
  isIncreasing: boolean;
}

const { state, setState } = useComponentState<CounterState>({
  count: 0,
  isIncreasing: true
});
```

### 3. Use Functional State Updates

```typescript
// ✅ Good - safe with concurrent updates
setState(prevState => ({ ...prevState, value: newValue }));

// ❌ Bad - can overwrite concurrent updates
setState({ ...state, value: newValue });
```

### 4. Keep State Simple and Predictable

```typescript
// ✅ Good - simple state structure
const { state, setState } = useComponentState({
  value: '',
  isValid: false,
  errors: []
});

// ❌ Avoid - overly complex nested state
const { state, setState } = useComponentState({
  form: {
    fields: {
      user: {
        profile: {
          details: { ... }
        }
      }
    }
  }
});
```

**Note:** Cleanup is now automatic! The StateManager handles all cleanup when views unmount.

## IE 11 Compatibility

The StateManager is designed to work on Internet Explorer 11:

- **No ES6+ Features**: No Proxy, Map, Set, async/await, etc.
- **Polyfill-free**: Works with native ES5 features
- **Traditional Loops**: Uses for loops instead of forEach/map where performance matters
- **Manual Array Management**: Uses splice() instead of modern array methods

## Performance Considerations

- **Shallow Equality**: State changes use shallow comparison to prevent unnecessary re-renders
- **Batch Updates**: Multiple state updates are batched using `requestAnimationFrame` (with IE 11 fallback)
- **Stable Component IDs**: Uses first-render call order (like React hooks) for maximum stability
- **Memory Management**: Automatic cleanup prevents memory leaks
- **Single Frame Updates**: All setState calls within a frame are batched into a single re-render
- **Subscription Model**: Components can subscribe to state changes for efficient updates

### Batching System

The StateManager implements a batching system similar to React's:

```typescript
// These three setState calls happen in the same frame
setState({ count: 1 });
setState({ count: 2 }); 
setState({ count: 3 });

// Only triggers ONE re-render with final state: { count: 3 }
```

### Stable Component IDs

Component IDs are generated based on the **call order during the first render**, then locked in for subsequent renders:

```typescript
// First render: IDs assigned based on call order
{showHeader && Header()}           // Gets ID: view-comp-0 (if rendered)
{Counter({ label: "Main" })}       // Gets ID: view-comp-1 (always)
{showFooter && Footer()}           // Gets ID: view-comp-2 (if rendered)

// Subsequent renders: Same IDs reused regardless of conditional rendering
// Components maintain their state even when order changes
```

**Key Benefits:**
- **Render-stable**: IDs don't change between re-renders
- **Call-order based**: Uses the same approach as React hooks
- **Conditional-safe**: Components keep state when conditionally rendered
- **No call stack dependency**: Avoids issues with JavaScript engine optimizations

## Troubleshooting

### Component Not Re-rendering

**Problem:** State changes but component doesn't re-render.

**Solution:** The StateManager automatically handles view integration. If components aren't re-rendering, check that:
1. Your component is being used within a view that extends `APMViewImpl`
2. The view's `render()` method is being called properly
3. State updates are using functional updates: `setState(prevState => ({ ...prevState, newValue }))`

### State Shared Between Components

**Problem:** Multiple component instances share the same state.

**Solution:** The StateManager automatically generates unique IDs for each component instance. This should not happen with the current system. If you encounter this issue:
1. Make sure you're using `useComponentState()` and not manually managing state
2. Check for any global variables that might be interfering
3. Verify components are rendered within proper view contexts

### Memory Leaks

**Problem:** State persists after component removal.

**Solution:** StateManager automatically cleans up when views unmount. For manual cleanup:

```typescript
cleanupComponentState(componentId);
```

### IE 11 Compatibility Issues

**Problem:** StateManager doesn't work on IE 11.

**Solution:** The StateManager is designed for IE 11 compatibility. If you encounter issues, check for:
- Modern JavaScript features in your component code
- Missing polyfills for other parts of your application
- Console errors that might indicate the root cause
