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

#### Component State Management with StateManager:
```typescript
const MyComponent = (props) => {
  const { state, setState, watch } = useComponentState({
    value: '',
    focusedIndex: 0
  });

  // Watch for specific field changes
  watch('focusedIndex', (newIndex) => {
    console.log('Focus changed to index:', newIndex);
  });

  // Watch for any state changes
  watch((state) => {
    console.log('State changed:', state);
  });

  return input({
    value: state.value,
    oninput: (_, value) => setState({ ...state, value })
  });
};
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

## Built-in Form Components

The APM system includes several specialized form components:

### Input Component (`src/apm/elements/input.ts`)
Handles various input types with validation and styling:
```typescript
input({
  type: 'text',
  name: 'email',
  placeholder: 'Enter your email',
  required: true,
  oninput: handleEmailChange
})
```

### Phone Component (`src/apm/elements/phone.ts`)
Specialized phone input with country code selection:
```typescript
phone({
  name: 'phone',
  dialingCodes: countryDialingCodes,
  value: phoneNumber,
  onchange: handlePhoneChange
})
```

### Select Component (`src/apm/elements/select.ts`)
Dropdown selection with options:
```typescript
select({
  name: 'country',
  options: countryOptions,
  value: selectedCountry,
  onchange: handleCountryChange
})
```

### Checkbox Component (`src/apm/elements/checkbox.ts`)
Boolean checkbox input:
```typescript
Checkbox({
  name: 'terms',
  checked: agreedToTerms,
  label: 'I agree to the terms and conditions',
  onchange: handleTermsChange
})
```

### OTP Component (`src/apm/elements/otp.ts`)
One-time password input with multiple fields:
```typescript
OTP({
  name: 'verification_code',
  length: 6,
  type: 'numeric',
  label: 'Enter verification code',
  onComplete: (name, otpValue) => {
    console.log('OTP completed:', otpValue);
  }
})
```

### Copy Instruction Component (`src/apm/elements/copy-instruction.ts`)
Displays copyable payment instructions:
```typescript
copyInstruction({
  instruction: {
    label: 'Reference Number',
    value: 'REF123456789',
    type: 'message'
  }
})
```

## UI Enhancement Features

### Copy Container Grouping
The system automatically groups consecutive copy instructions with labels into containers for better visual organization:

```typescript
// Consecutive instructions are automatically grouped
copyInstruction({ instruction: { label: 'Bank', value: 'Example Bank' } }),
copyInstruction({ instruction: { label: 'Account', value: '1234567890' } }),
// Creates a single copy-container div around both instructions
```

### Loader Component (`src/apm/elements/loader.ts`)
Shows loading states:
```typescript
loader({
  message: 'Processing payment...',
  showSpinner: true
})
```

### QR Code Component (`src/apm/elements/qr.ts`)
Displays QR codes for payment methods:
```typescript
qr({
  qrCodeData: paymentQRData,
  size: 200
})
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

## Event System

The APM system uses a comprehensive event system aligned with mobile implementations:

### Event Types
```typescript
interface APMEvents {
  "initialised": never;                    // APM initialized
  "start": never;                         // Ready for user input
  "field-change": { parameter: {...} };   // Form field changed
  "submit": { parameters: [...] };        // Form submitted
  "submit-success": { additionalParametersExpected: boolean };
  "submit-error": { failure: {...} };     // Validation error
  "payment-pending": never;               // Waiting for confirmation
  "pending-confirmed": never;             // User confirmed action
  "success": { trigger: 'user' | 'timeout' | 'immediate' };
  "failure": { failure: {...}, paymentState?: string };
  "request-cancel": never;                // User requested cancellation
  "*": { type: string, ...eventData };   // Universal event
}
```

### Event Usage
```typescript
const apm = client.apm.authorization(container, options);

// Listen to specific events
apm.on('field-change', (data) => {
  console.log('Field changed:', data.parameter);
});

// Universal event listener
apm.on('*', (event) => {
  console.log(`Event: ${event.type}`, event);
});

apm.initialise();
```

## API Integration

### API Polling with Cancellation
The system includes automatic API polling with cancellation capabilities:

```typescript
// API automatically polls for payment status
// Polling can be cancelled when user cancels payment
apm.on('request-cancel', () => {
  // API polling is automatically cancelled
  console.log('Payment cancelled by user');
});
```

### Request Handling
```typescript
// API handles different response states
API.initialise({
  onSuccess: (response) => {
    // Handle success or pending states
  },
  onError: (error) => {
    // Handle validation errors
  },
  onFailure: (error) => {
    // Handle system failures
  }
});
```

## Advanced Features

### Error Handling
The system includes comprehensive error handling:
- **Runtime error proxies** wrap view instances
- **Critical failure handling** with user-friendly messages
- **Graceful degradation** for unsupported browsers
- **Validation error display** integrated with form components

### Performance Optimizations
- **Batched updates**: Multiple `setState` calls are batched into single renders
- **Virtual DOM diffing**: Only changed elements are updated in the real DOM
- **Key-based reconciliation**: Efficient list updates using element keys
- **RequestAnimationFrame**: Updates are scheduled for optimal performance

### Browser Compatibility
- **Shadow DOM**: Modern browsers get isolated styling
- **iframe fallback**: Older browsers use iframe isolation
- **Polyfill support**: Includes necessary polyfills for older browsers

### Form State Management
The system provides sophisticated form state management:
- **Field validation**: Real-time validation with error display
- **State persistence**: Form data persists across view changes
- **Event prevention**: Prevents spurious events during form operations

## Example: Complete Payment Component

```typescript
class PaymentFormView extends APMViewImpl<{}, { 
  amount: number; 
  loading: boolean; 
  email: string;
  agreedToTerms: boolean;
}> {
  state = { 
    amount: 0, 
    loading: false, 
    email: '', 
    agreedToTerms: false 
  };
  
  styles() {
    return `
      .payment-form { 
        padding: 20px; 
        max-width: 400px; 
        margin: 0 auto; 
      }
      .form-group { 
        margin-bottom: 15px; 
      }
      .submit-btn { 
        width: 100%;
        padding: 12px;
        background: #007bff; 
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
  }
  
  handleEmailChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    this.setState({ email: value });
    
    // Emit field-change event
    ContextImpl.context.events.emit('field-change', {
      parameter: { key: 'email', value }
    });
  }
  
  handleTermsChange = (event: Event) => {
    const checked = (event.target as HTMLInputElement).checked;
    this.setState({ agreedToTerms: checked });
    
    ContextImpl.context.events.emit('field-change', {
      parameter: { key: 'terms', value: checked }
    });
  }
  
  handleSubmit = () => {
    if (!this.state.email || !this.state.agreedToTerms) {
      return;
    }
    
    this.setState({ loading: true });
    
    // Emit submit event
    ContextImpl.context.events.emit('submit', {
      parameters: [
        { key: 'email', value: this.state.email },
        { key: 'terms', value: this.state.agreedToTerms }
      ]
    });
    
    // Process payment
    API.sendFormData({
      email: this.state.email,
      terms_accepted: this.state.agreedToTerms
    })({
      onSuccess: (response) => {
        this.setState({ loading: false });
        ContextImpl.context.events.emit('submit-success', {
          additionalParametersExpected: !!response.elements
        });
      },
      onError: (error) => {
        this.setState({ loading: false });
        ContextImpl.context.events.emit('submit-error', {
          failure: error.error
        });
      }
    });
  }
  
  render() {
    const { div, input, button, label } = elements;

    let buttonText = 'Continue payment'

    if (loading) {
      buttonText = 'Processing...';
    }
    
    return div({ className: 'payment-form' },
      div({ className: 'form-group' },
        label({ htmlFor: 'email' }, 'Email Address'),
        input({
          id: 'email',
          type: 'email',
          value: this.state.email,
          oninput: this.handleEmailChange,
          placeholder: 'Enter your email',
          required: true
        })
      ),
      
      div({ className: 'form-group' },
        checkbox({
          name: 'terms',
          checked: this.state.agreedToTerms,
          onchange: this.handleTermsChange
        }, 'I agree to the terms and conditions')
      ),
      
      button({
        className: 'submit-btn',
        onclick: this.handleSubmit,
        disabled: this.state.loading || !this.state.email || !this.state.agreedToTerms
      }, 
        buttonText
      )
    );
  }
}

// Usage
const page = new APMPageImpl(document.getElementById('payment-container'));
page.render(PaymentFormView);
```

## File Structure

```
src/apm/
├── Page.ts                    # Main page orchestrator
├── API.ts                     # API integration with polling
├── Context.ts                 # Global context management
├── Storage.ts                 # Persistent storage utilities
├── Theme.ts                   # Theme management
├── views/
│   ├── View.ts               # Base view class with state management
│   ├── Components.ts         # Form component implementations
│   ├── Success.ts            # Success view
│   ├── Error.ts              # Error view
│   ├── Loading.ts            # Loading view
│   ├── NextSteps.ts          # Next steps view
│   ├── Pending.ts            # Pending payment view
│   └── utils/
│       ├── form.ts           # Form utilities
│       ├── instructions.ts   # Instruction utilities
│       └── render-elements.ts # Element rendering utilities
├── elements/
│   ├── elements.ts           # Virtual DOM implementation
│   ├── input.ts              # Input component
│   ├── phone.ts              # Phone input component
│   ├── select.ts             # Select component
│   ├── checkbox.ts           # Checkbox component
│   ├── otp.ts                # OTP component
│   ├── copy-instruction.ts   # Copy instruction component
│   ├── loader.ts             # Loader component
│   ├── qr.ts                 # QR code component
│   ├── button.ts             # Button component
│   ├── header.ts             # Header component
│   └── tick.ts               # Success tick component
├── events/
│   ├── APMEventListener.ts   # APM-specific events
│   └── EventListener.ts      # Base event system
├── layouts/
│   └── Main.ts               # Main layout component
└── utils.ts                  # Utility functions
```

## Configuration

The APM system supports nested configuration for better organization:

```typescript
const apm = client.apm.authorization(container, {
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  
  // Confirmation settings
  confirmation: {
    requiresAction: true,        // Require user confirmation for pending
    timeout: 900,                // Timeout in seconds (15 minutes)
    allowCancelation: true       // Allow cancellation during confirmation
  },
  
  // Success screen settings
  success: {
    enabled: true,               // Show success screen
    requiresAction: false,       // Auto-dismiss vs manual
    autoDismissDuration: 3,      // Auto-dismiss duration (seconds)
    manualDismissDuration: 60    // Manual dismiss timeout (seconds)
  },
  
  // Pre-filled data
  initialData: {
    email: 'user@example.com'
  },
  
  // Theme customization
  theme: {
    palette: {
      light: {
        surface: {
          button: {
            primary: '#007bff',
            secondary: '#6c757d',
            hover: {
              primary: '#0056b3',
              secondary: '#545b62'
            }
          }
        },
        text: {
          default: '#000000',
          label: '#707378'
        }
      },
      dark: {
        surface: {
          button: {
            primary: '#007bff',
            secondary: '#6c757d',
            hover: {
              primary: '#0056b3',
              secondary: '#545b62'
            }
          }
        },
        text: {
          default: '#FFFFFF',
          label: '#A7A9AF'
        }
      }
    }
  }
});
```

**Note:** The theme system uses text colors from your theme configuration. For buttons, it automatically selects between your defined light and dark text colors based on background color luminance to ensure proper contrast. You can customize both background and text colors - the system intelligently chooses which text color to use for accessibility.

## Benefits

1. **Encapsulation**: Shadow DOM/iframe isolation prevents style conflicts
2. **Performance**: Virtual DOM ensures efficient updates
3. **Type Safety**: Full TypeScript support throughout the system
4. **Maintainability**: Clear separation of concerns between Page, View, and Elements
5. **Flexibility**: Easy to extend with new views and components
6. **Browser Support**: Graceful degradation for older browsers
7. **Developer Experience**: JSX-like syntax with full IDE support
8. **Mobile Alignment**: Event system aligned with mobile implementations
9. **Comprehensive Components**: Rich set of form components with built-in validation
10. **Robust API Integration**: Automatic polling with cancellation support

This architecture provides a solid foundation for building complex, interactive payment interfaces while maintaining performance, reliability, and developer productivity across web and mobile platforms. 