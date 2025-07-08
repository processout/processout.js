# APM UI System Architecture

The APM (Alternative Payment Methods) UI system is a modern, component-based architecture built around three core concepts: **Page**, **View**, and **Elements**. This system provides a robust foundation for building interactive payment forms with state management, virtual DOM rendering, and component isolation.

## Overview

The APM UI system follows a hierarchical structure:

```
Page (Container & Orchestrator)
  └── View (State Management & Rendering)
      └── Elements (Virtual DOM Components)
```

## Core Components

### 1. Page (`src/apm/Page.ts`)

The **Page** serves as the main container and orchestrator for the entire UI system. It manages:

- **Shadow DOM/iframe isolation** for style encapsulation
- **View lifecycle** (mounting, rendering, cleanup)
- **API integration** and request handling
- **State flow management** (SUCCESS, PENDING, NEXT_STEP_REQUIRED, etc.)

#### Key Features:

- **Adaptive rendering strategy**: Uses Shadow DOM when supported, falls back to iframe for older browsers
- **Font loading**: Automatically injects Google Fonts (Work Sans) for consistent typography
- **Error handling**: Provides critical failure management and user feedback
- **Theme integration**: Applies styles through the Theme system

#### Example Usage:
```typescript
// Page manages the overall container and delegates to views
const page = new APMPageImpl(containerElement);
page.render(APMViewNextSteps, { elements, config });
page.load(apiRequest);
```

### 2. View (`src/apm/views/View.ts`)

The **View** is the "engine" of the UI system. It's a reusable base class (`APMViewImpl`) that provides:

- **State-driven rendering** with efficient updates
- **Virtual DOM patching** for optimal performance
- **Component lifecycle management**
- **Error handling** with runtime proxies

#### Key Features:

- **Reactive state management**: Uses `setState()` with batched updates via `requestAnimationFrame`
- **Virtual DOM diffing**: Efficiently patches only changed DOM elements
- **Props and state separation**: Clean separation of external props and internal state
- **Style injection**: Automatic CSS injection into Shadow DOM/iframe
- **Ref system**: Provides direct DOM element access when needed

#### State Management:
```typescript
class MyView extends APMViewImpl<Props, State> {
  state = { count: 0 };
  
  handleIncrement() {
    this.setState({ count: this.state.count + 1 });
  }
  
  render() {
    return div({}, `Count: ${this.state.count}`);
  }
}
```

#### View Lifecycle:
1. **Construction**: Initialize props, state, and error handling
2. **Mount**: Create initial Virtual DOM and inject into real DOM
3. **Updates**: Process state changes and patch DOM differences
4. **Cleanup**: Remove event listeners and DOM elements

### 3. Elements (`src/apm/elements/elements.ts`)

The **Elements** system provides a lightweight Virtual DOM implementation inspired by React/Vue:

- **Virtual DOM nodes (VNode)**: Lightweight representations of DOM elements
- **JSX-like syntax**: Functional approach to building UI trees
- **Type safety**: Full TypeScript support for HTML elements and props
- **Key-based reconciliation**: Efficient list rendering and updates

#### Key Features:

- **Tagged template functions**: Each HTML tag has a corresponding function (`div()`, `button()`, etc.)
- **Props handling**: Type-safe props with special handling for events, refs, and keys
- **Child processing**: Automatic flattening and normalization of nested children
- **Fragment support**: Group elements without wrapper divs

#### Virtual DOM Structure:
```typescript
interface VNode {
  type: Tag | '#text' | null;           // Element type
  props: Props<Type>;                   // Element properties
  children: VNode[];                    // Child elements
  dom: Node | null;                     // Real DOM reference
  key?: string;                         // Reconciliation key
  value?: string;                       // Text content (for text nodes)
}
```

#### Element Creation:
```typescript
const { div, button, input } = elements;

// Create elements with props and children
const myButton = button(
  { 
    className: 'primary-btn',
    onclick: handleClick,
    ref: (el) => buttonRef = el
  },
  'Click me'
);

// Nest elements naturally
const form = div({ className: 'form' },
  input({ type: 'text', name: 'username' }),
  button({ type: 'submit' }, 'Submit')
);
```

## Data Flow

### 1. Initialization Flow
```
User Container → Page.constructor() → Shadow DOM/iframe setup → Style injection
```

### 2. Rendering Flow
```
Page.render() → View.constructor() → View.mount() → 
Virtual DOM creation → Real DOM generation → DOM insertion
```

### 3. Update Flow
```
User interaction → Event handler → setState() → 
Batched update (RAF) → Virtual DOM diff → DOM patching
```

### 4. API Integration Flow
```
Page.load() → API request → Response handling → 
State determination → View selection → Re-render
```

## Advanced Features

### Error Handling
The system includes comprehensive error handling:
- **Runtime error proxies** wrap view instances
- **Critical failure handling** with user-friendly messages
- **Graceful degradation** for unsupported browsers

### Performance Optimizations
- **Batched updates**: Multiple `setState` calls are batched into single renders
- **Virtual DOM diffing**: Only changed elements are updated in the real DOM
- **Key-based reconciliation**: Efficient list updates using element keys
- **RequestAnimationFrame**: Updates are scheduled for optimal performance

### Browser Compatibility
- **Shadow DOM**: Modern browsers get isolated styling
- **iframe fallback**: Older browsers use iframe isolation
- **Polyfill support**: Includes necessary polyfills for older browsers

## Example: Complete Component

```typescript
class PaymentForm extends APMViewImpl<{}, { amount: number; loading: boolean }> {
  state = { amount: 0, loading: false };
  
  styles() {
    return `
      .payment-form { padding: 20px; }
      .amount-input { margin: 10px 0; }
      .submit-btn { background: #007bff; color: white; }
    `;
  }
  
  handleAmountChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.setState({ amount: parseFloat(value) || 0 });
  }
  
  handleSubmit() {
    this.setState({ loading: true });
    // API call logic here
  }
  
  render() {
    const { div, input, button } = elements;
    
    return div({ className: 'payment-form' },
      input({
        className: 'amount-input',
        type: 'number',
        value: this.state.amount,
        oninput: this.handleAmountChange.bind(this)
      }),
      button({
        className: 'submit-btn',
        onclick: this.handleSubmit.bind(this),
        disabled: this.state.loading
      }, 
        this.state.loading ? 'Processing...' : 'Pay Now'
      )
    );
  }
}

// Usage
const page = new APMPageImpl(document.getElementById('payment-container'));
page.render(PaymentForm);
```

## File Structure

```
src/apm/
├── Page.ts                    # Main page orchestrator
├── views/
│   ├── View.ts               # Base view class with state management
│   ├── Components.ts         # Example component implementations
│   ├── Success.ts            # Success view
│   ├── Error.ts              # Error view
│   ├── NextSteps.ts          # Next steps view
│   └── utils/
│       └── render-elements.ts # Element rendering utilities
└── elements/
    └── elements.ts           # Virtual DOM implementation
```

## Benefits

1. **Encapsulation**: Shadow DOM/iframe isolation prevents style conflicts
2. **Performance**: Virtual DOM ensures efficient updates
3. **Type Safety**: Full TypeScript support throughout the system
4. **Maintainability**: Clear separation of concerns between Page, View, and Elements
5. **Flexibility**: Easy to extend with new views and components
6. **Browser Support**: Graceful degradation for older browsers
7. **Developer Experience**: JSX-like syntax with full IDE support

This architecture provides a solid foundation for building complex, interactive payment interfaces while maintaining performance, reliability, and developer productivity. 