# Migration Guide: From setupNativeApm to apm.authorization/apm.tokenization

This guide will help you migrate from the legacy `setupNativeApm` API to the new `apm.authorization` and `apm.tokenization` APIs. The new APIs provide better separation of concerns, improved error handling, and more flexible configuration options.

## Overview of Changes

The new APM system introduces several key improvements:

- **Flow-specific methods**: Separate methods for authorization (payments) vs tokenization (saving payment methods)
- **Improved container handling**: Container is passed during initialization rather than mounting
- **Enhanced event system**: Instance-level events aligned with mobile implementation
- **Better configuration**: Nested configuration objects for success screens and confirmation settings
- **Explicit lifecycle management**: Clear initialization and cleanup methods

## API Comparison

### Legacy API (setupNativeApm)
```javascript
const nativeApm = client.setupNativeApm(config);
nativeApm.mount(container);
```

### New API (apm.authorization/tokenization)
```javascript
const apm = client.apm.authorization(container, options);
// or
const apm = client.apm.tokenization(container, options);
apm.initialise();
```

## Step-by-Step Migration

### 1. Choose the Appropriate Flow

First, determine which flow you need:

- **Use `apm.authorization`** for processing payments with invoices
- **Use `apm.tokenization`** for processing payments with already created customer tokens

```javascript
// For payments (old setupNativeApm equivalent)
const apm = client.apm.authorization(container, options);

// For tokenization (new capability)
const apm = client.apm.tokenization(container, options);
```

### 2. Update Method Signature

**Before:**
```javascript
const nativeApm = client.setupNativeApm({
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  returnUrl: 'https://example.com/return',
  pollingMaxTimeout: 180
});

nativeApm.mount('#container');
```

**After:**
```javascript
// Authorization flow
const apm = client.apm.authorization('#container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  confirmation: {
    timeout: 900, // 15 minutes in seconds
  },
});

// Tokenization flow
const apm = client.apm.tokenization('#container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  customerId: 'cust_xxx',
  customerTokenId: 'tok_xxx',
});

apm.initialise();
```

### 3. Update Configuration Options

The configuration options have been restructured into nested objects:

| Legacy Option | New Option | Notes |
|---------------|------------|-------|
| `returnUrl` | *(removed)* | Handled by invoice configuration |
| `pollingMaxTimeout` | `confirmation.timeout` | Default 900 seconds (15 minutes) |
| *(new)* | `confirmation.requiresAction` | Require user confirmation for pending (default: false) |
| *(new)* | `confirmation.allowCancelation` | Allow cancellation during confirmation (default: true) |
| *(new)* | `success.enabled` | Whether to show success screen (default: true) |
| *(new)* | `success.autoDismissDuration` | Duration when auto-dismissing (default: 3s) |
| *(new)* | `success.manualDismissDuration` | Duration when manual dismissal required (default: 60s) |
| *(new)* | `success.requiresAction` | Whether user must dismiss manually (default: false) |
| *(new)* | `allowCancelation` | Whether user can cancel payment (default: true) |
| *(new)* | `initialData` | Prefilled form data |
| *(new)* | `theme` | Theme configuration |

### 4. Update Theming

**Before:**
```javascript
const nativeApm = client.setupNativeApm(config);
nativeApm.setTheme({
  buttons: {
    default: {
      backgroundColor: 'green',
      color: 'white'
    }
  }
});
```

**After:**
```javascript
const apm = client.apm.authorization('#container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  theme: {
    palette: {
      light: {
        surface: {
          button: {
            primary: 'green'
          }
        },
        text: {
          default: 'white'  // Used for button text when background is dark enough
        }
      }
    }
  }
});
```

**Note:** The new theme system uses text colors from the theme configuration. For buttons, it automatically selects between light and dark text colors based on the button's background color luminance to ensure proper contrast. You can customize both background colors and text colors in the theme.

### 5. Update Data Prefilling

**Before:**
```javascript
const nativeApm = client.setupNativeApm(config);
nativeApm.prefillData({
  email: 'john@doe.com'
});
```

**After:**
```javascript
const apm = client.apm.authorization('#container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  initialData: {
    email: 'john@doe.com'
  }
});
```

### 6. Update Event Handling

The event system has been completely redesigned and aligned with the mobile team implementation:

**Before:**
```javascript
window.addEventListener('processout_native_apm_loading', (e) => {
  console.log('Widget loading');
});

window.addEventListener('processout_native_apm_ready', (e) => {
  console.log('Widget ready');
});

window.addEventListener('processout_native_apm_payment_init', (e) => {
  console.log('Payment initialized');
});

window.addEventListener('processout_native_apm_payment_success', (e) => {
  console.log('Payment successful', e.detail);
});

window.addEventListener('processout_native_apm_payment_error', (e) => {
  console.log('Payment error', e.detail);
});
```

**After:**
```javascript
// New mobile-aligned event system
apm.on('initialised', () => {
  console.log('APM initialized');
});

apm.on('start', () => {
  console.log('APM started, waiting for user input');
});

apm.on('field-change', (data) => {
  console.log('Field changed:', data.parameter);
});

apm.on('submit', (data) => {
  console.log('Form submitted:', data.parameters);
});

apm.on('submit-success', (data) => {
  console.log('Submit successful, additional input needed:', data.additionalParametersExpected);
});

apm.on('submit-error', (data) => {
  console.log('Submit error:', data.failure);
});

apm.on('payment-pending', () => {
  console.log('Payment pending, waiting for confirmation');
});

apm.on('pending-confirmed', () => {
  console.log('User confirmed pending payment action');
});

apm.on('success', (data) => {
  console.log('Payment successful, trigger:', data.trigger);
  apm.cleanUp(); // Important: clean up when done
});

apm.on('failure', (data) => {
  console.log('Payment failed:', data.failure);
  if (data.paymentState) {
    console.log('Payment state at failure:', data.paymentState);
  }
  apm.cleanUp(); // Important: clean up on failure
});

apm.on('request-cancel', () => {
  console.log('User requested payment cancellation');
});

// Universal event listener that fires for all events
apm.on('*', (event) => {
  console.log('Event fired:', event.type, event);
});
```

### 7. Add Proper Cleanup

The new API requires explicit cleanup to prevent memory leaks:

```javascript
apm.on('success', () => {
  console.log('Payment completed successfully');
  apm.cleanUp(); // Clean up resources
});

apm.on('failure', () => {
  console.log('Payment failed');
  apm.cleanUp(); // Clean up resources
});

// Also clean up if user navigates away or component unmounts
window.addEventListener('beforeunload', () => {
  apm.cleanUp();
});
```

## Complete Migration Examples

### Example 1: Basic Authorization Flow

**Before (setupNativeApm):**
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const projectId = 'test-proj_xxx';
  const client = new ProcessOut.ProcessOut(projectId);

  const nativeApm = client.setupNativeApm({
    gatewayConfigurationId: 'gway_conf_xxx',
    invoiceId: 'iv_xxx'
  });

  nativeApm.mount('#container');

  window.addEventListener('processout_native_apm_payment_success', (e) => {
    console.log('Payment successful!');
    window.location.href = e.detail.returnUrl;
  });

  window.addEventListener('processout_native_apm_payment_error', (e) => {
    console.error('Payment failed:', e.detail);
  });
});
```

**After (apm.authorization):**
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const projectId = 'test-proj_xxx';
  const client = new ProcessOut.ProcessOut(projectId);

  const apm = client.apm.authorization('#container', {
    gatewayConfigurationId: 'gway_conf_xxx',
    invoiceId: 'iv_xxx'
  });

  apm.on('success', (data) => {
    console.log('Payment successful!', data);
    apm.cleanUp();
    // Handle success (redirect handled by invoice configuration)
  });

  apm.on('failure', (data) => {
    console.error('Payment failed:', data.failure);
    apm.cleanUp();
  });

  apm.on('submit-error', (data) => {
    console.error('Validation error:', data.failure);
  });

  try {
    apm.initialise();
  } catch (error) {
    console.error('Failed to initialize APM:', error);
    apm.cleanUp();
  }
});
```

### Example 2: With Custom Configuration

**Before:**
```javascript
const nativeApm = client.setupNativeApm({
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  pollingMaxTimeout: 300
});

nativeApm.setTheme({
  buttons: {
    default: {
      backgroundColor: '#007bff',
      color: 'white',
      fontWeight: 'bold'
    }
  }
});

nativeApm.prefillData({
  email: 'customer@example.com'
});

nativeApm.mount('#payment-container');
```

**After:**
```javascript
const apm = client.apm.authorization('#payment-container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  invoiceId: 'iv_xxx',
  confirmation: {
    timeout: 300
  },
  theme: {
    palette: {
      light: {
        surface: {
          button: {
            primary: '#007bff'
          }
        },
        text: {
          default: 'white'
        }
      }
    }
  },
  initialData: {
    email: 'customer@example.com'
  }
});

apm.on('success', () => {
  apm.cleanUp();
});

apm.on('failure', () => {
  apm.cleanUp();
});

apm.initialise();
```

### Example 3: Tokenization Flow (New Capability)

The tokenization flow is new and wasn't available with `setupNativeApm`:

```javascript
const apm = client.apm.tokenization('#container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  customerId: 'cust_xxx',
  customerTokenId: 'tok_xxx'
});

apm.on('success', (data) => {
  console.log('Payment method saved successfully!');
  apm.cleanUp();
});

apm.on('failure', (data) => {
  console.error('Tokenization failed:', data.failure);
  apm.cleanUp();
});

apm.initialise();
```

## New Event System Details

The new event system is aligned with the mobile team implementation and provides comprehensive lifecycle events:

### Event Flow
1. **`initialised`** - Fired when APM is initialized
2. **`start`** - Fired when initial data is loaded and waiting for user input
3. **`field-change`** - Fired when user changes any form field
4. **`submit`** - Fired when form is submitted
5. **`submit-success`** - Fired when submission is successful
6. **`submit-error`** - Fired when submission fails with validation errors
7. **`payment-pending`** - Fired when payment is pending external confirmation
8. **`pending-confirmed`** - Fired when user confirms pending action
9. **`success`** - Fired when payment is successful (final event)
10. **`failure`** - Fired when payment fails (final event)
11. **`request-cancel`** - Fired when user requests cancellation

### Universal Event Listener
The `*` event fires for all events with a unified structure:
```javascript
apm.on('*', (event) => {
  console.log(`Event: ${event.type}`, event);
});
```

## Migration Checklist

Use this checklist to ensure you've completed all migration steps:

- [ ] **Flow Selection**: Chosen between `apm.authorization` or `apm.tokenization`
- [ ] **Method Signature**: Updated from `setupNativeApm(config)` to `apm.authorization(container, options)`
- [ ] **Container Handling**: Moved container from `.mount()` to constructor
- [ ] **Configuration**: Updated to nested objects (`confirmation`, `success`)
- [ ] **Event Handlers**: Migrated from window events to instance events with new event names
- [ ] **Initialization**: Added explicit `.initialise()` call
- [ ] **Cleanup**: Added `.cleanUp()` calls in success/failure handlers
- [ ] **Error Handling**: Added try-catch around `.initialise()`
- [ ] **Testing**: Verified all functionality works with new API

## Troubleshooting

### Common Migration Issues

#### 1. Container Not Found Error

**Error Message:**
```
Cannot read properties of null (reading 'appendChild')
TypeError: container is null
```

**Cause:** Container element doesn't exist when APM is created

**Solution:**
```javascript
// ❌ Wrong - container might not exist yet
const apm = client.apm.authorization('#my-container', config);

// ✅ Correct - ensure DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('my-container');
  if (!container) {
    console.error('Container element not found');
    return;
  }
  const apm = client.apm.authorization(container, config);
  apm.initialise();
});

// ✅ Alternative - check container exists
const container = document.querySelector('#my-container');
if (container) {
  const apm = client.apm.authorization(container, config);
  apm.initialise();
} else {
  console.error('Payment container not found');
}
```

#### 2. Events Not Firing

**Problem:** Old window events still in code, new events not working, or timing issues

**Common causes:**

1. **Using old window events:**
```javascript
// ❌ Old events won't work
window.addEventListener('processout_native_apm_payment_success', handler);

// ✅ Use new instance events
apm.on('success', (data) => {
  console.log('Payment successful:', data);
  apm.cleanUp();
});
```

2. **Adding events after initialise() - missing early events:**
```javascript
// ❌ Wrong order - misses 'initialised' and 'start' events
const apm = client.apm.authorization(container, config);
apm.initialise();
apm.on('initialised', handler); // This won't fire - already happened!
apm.on('start', handler); // This won't fire - already happened!

// ✅ Correct order - add events before initialise()
const apm = client.apm.authorization(container, config);
apm.on('initialised', handler);
apm.on('start', handler);
apm.on('success', handler);
apm.initialise(); // Now events will fire properly
```

3. **Debug with universal listener:**
```javascript
// ✅ Add this first to see all events
apm.on('*', (event) => {
  console.log('APM Event:', event.type, event);
});
```

#### 3. Theme Not Applying

**Problem:** Old theme structure doesn't work with new API

**Solution:**
```javascript
// ❌ Old theme structure
theme: {
  buttons: {
    default: { backgroundColor: 'blue' }
  }
}

// ✅ New theme structure
theme: {
  palette: {
    light: {
      surface: {
        button: {
          primary: 'blue'
        }
      }
    }
  }
}
```

**Note:** The payment widget may use Shadow DOM or iframe, so external CSS won't work. Always use the theme configuration for styling.

### Runtime Issues

#### 4. Widget Not Appearing

**Common causes and solutions:**

1. **Missing initialization:**
```javascript
// ❌ Forgot to call initialise()
const apm = client.apm.authorization(container, config);
apm.on('success', handler);
// Missing: apm.initialise();

// ✅ Always call initialise()
const apm = client.apm.authorization(container, config);
apm.on('success', handler);
apm.initialise();
```

2. **Check browser console** for JavaScript errors and network issues

#### 5. Network/API Errors

**Common Error Messages:**
```
Failed to fetch
CORS error
404 Not Found on /invoices/iv_xxx/apm-payment
```

**Solutions:**

```javascript
// ✅ Verify correct gateway configuration ID format
gatewayConfigurationId: 'gway_conf_xxx' // Must start with 'gway_conf_'

// ✅ Verify correct invoice ID format
invoiceId: 'iv_xxx' // Must start with 'iv_'

// ✅ Check environment URLs
// Development: https://api.processout.com
// Production: https://api.processout.com
```

### Debugging Tips

**Quick debugging checklist:**

1. **Check browser console** for JavaScript errors
2. **Verify container element** exists and is accessible
3. **Test with minimal example** from this guide
4. **Check network tab** for failed API requests  
5. **Verify API credentials** and gateway configuration

**Simple debugging code:**
```javascript
// Add universal event listener to see what's happening
apm.on('*', (event) => {
  console.log('APM Event:', event.type, event);
});

// Check if container exists
const container = document.querySelector('#payment-container');
console.log('Container exists:', !!container);
```

**When reporting issues, include:**

- Browser and version
- JavaScript framework and version (if any)
- Exact error messages from console
- Minimal code example that reproduces the issue

## Conclusion

The new APM API provides a more robust and flexible foundation for alternative payment methods. The key improvements include:

- **Mobile-aligned event system** with comprehensive lifecycle events
- **Nested configuration** for better organization and clarity
- **Explicit lifecycle management** with initialization and cleanup
- **Separate flows** for authorization vs tokenization
- **Universal event listener** for comprehensive event monitoring

The migration requires updating event handlers, configuration structure, and adding proper cleanup, but the improved architecture and mobile alignment make it worthwhile for long-term maintainability and feature parity across platforms. 