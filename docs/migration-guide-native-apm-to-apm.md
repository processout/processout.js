# Migration Guide: From setupNativeApm to apm.authorization/apm.tokenization

This guide will help you migrate from the legacy `setupNativeApm` API to the new `apm.authorization` and `apm.tokenization` APIs. The new APIs provide better separation of concerns, improved error handling, and more flexible configuration options.

## Overview of Changes

The new APM system introduces several key improvements:

- **Flow-specific methods**: Separate methods for authorization (payments) vs tokenization (saving payment methods)
- **Improved container handling**: Container is passed during initialization rather than mounting
- **Enhanced event system**: Instance-level events instead of global window events
- **Better configuration**: More granular options for success screens and timeouts
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
- **Use `apm.tokenization`** for saving payment methods without immediate payment

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
  successScreenMaximumTimeout: 10000 // milliseconds instead of seconds
});

// Tokenization flow
const apm = client.apm.tokenization('#container', {
  gatewayConfigurationId: 'gway_conf_xxx',
  customerId: 'cust_xxx',
  customerTokenId: 'ctok_xxx'
});

apm.initialise();
```

### 3. Update Configuration Options

The configuration options have been updated and expanded:

| Legacy Option | New Option | Notes |
|---------------|------------|-------|
| `returnUrl` | *(removed)* | Handled by invoice configuration |
| `pollingMaxTimeout` | *(system managed)* | 15-minute timeout is automatic |
| *(new)* | `successScreenMaximumTimeout` | Max time to show success screen (ms) |
| *(new)* | `successScreenMinimumTimeout` | Min time to show success screen (ms) |
| *(new)* | `successScreenConfirmation` | Require user confirmation on success |
| *(new)* | `showSuccesScreen` | Whether to show success screen |
| *(new)* | `requirePendingConfirmation` | Require confirmation for pending states |
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
    buttons: {
      default: {
        backgroundColor: 'green',
        color: 'white'
      }
    }
  }
});
```

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

The event system has been completely redesigned for better encapsulation:

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
apm.on('loading', () => {
  console.log('Widget loading');
});

apm.on('success', (data) => {
  console.log('Payment successful', data);
  apm.cleanUp(); // Important: clean up when done
});

apm.on('error', ({ message, code }) => {
  console.log('Payment error', message, code);
});

apm.on('critical-failure', ({ message, code }) => {
  console.log('Critical failure', message, code);
  apm.cleanUp(); // Important: clean up on failure
});
```

### 7. Add Proper Cleanup

The new API requires explicit cleanup to prevent memory leaks:

```javascript
apm.on('success', () => {
  console.log('Payment completed successfully');
  apm.cleanUp(); // Clean up resources
});

apm.on('critical-failure', () => {
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
    invoiceId: 'iv_xxx',
    successScreenMaximumTimeout: 5000
  });

  apm.on('success', (data) => {
    console.log('Payment successful!', data);
    apm.cleanUp();
    // Handle success (redirect handled by invoice configuration)
  });

  apm.on('error', ({ message, code }) => {
    console.error('Payment failed:', message, code);
  });

  apm.on('critical-failure', ({ message, code }) => {
    console.error('Critical failure:', message, code);
    apm.cleanUp();
  });

  try {
    apm.initialise();
  } catch (error) {
    console.error('Failed to initialize APM:', error);
    apm.cleanUp();
  }
});
```

### Example 2: With Custom Theme and Prefilled Data

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
  successScreenMaximumTimeout: 7000,
  successScreenConfirmation: true,
  theme: {
    buttons: {
      default: {
        backgroundColor: '#007bff',
        color: 'white',
        fontWeight: 'bold'
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

apm.on('critical-failure', () => {
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
  customerTokenId: 'ctok_xxx',
  showSuccesScreen: true,
  successScreenMinimumTimeout: 3000
});

apm.on('success', (data) => {
  console.log('Payment method saved successfully!');
  apm.cleanUp();
});

apm.on('error', ({ message, code }) => {
  console.error('Tokenization failed:', message, code);
});

apm.on('critical-failure', ({ message, code }) => {
  console.error('Critical failure:', message, code);
  apm.cleanUp();
});

apm.initialise();
```

## Migration Checklist

Use this checklist to ensure you've completed all migration steps:

- [ ] **Flow Selection**: Chosen between `apm.authorization` or `apm.tokenization`
- [ ] **Method Signature**: Updated from `setupNativeApm(config)` to `apm.authorization(container, options)`
- [ ] **Container Handling**: Moved container from `.mount()` to constructor
- [ ] **Configuration**: Updated config options (timeouts, theme, initialData)
- [ ] **Event Handlers**: Migrated from window events to instance events
- [ ] **Initialization**: Added explicit `.initialise()` call
- [ ] **Cleanup**: Added `.cleanUp()` calls in success/failure handlers
- [ ] **Error Handling**: Added try-catch around `.initialise()`
- [ ] **Testing**: Verified all functionality works with new API

## Troubleshooting

### Common Issues

1. **"APM Context not initialised" Error**
   - Ensure you're calling `.initialise()` after creating the APM instance

2. **Events Not Firing**
   - Check that you're using instance events (`apm.on()`) instead of window events
   - Ensure `.initialise()` has been called

3. **Widget Not Appearing**
   - Verify the container element exists before passing it to the constructor
   - Check browser console for any JavaScript errors

4. **Memory Leaks**
   - Always call `.cleanUp()` when the payment flow completes
   - Add cleanup in error handlers and page unload events

### Getting Help

If you encounter issues during migration:

1. Check the browser console for error messages
2. Verify all required parameters are provided
3. Ensure your project ID and gateway configuration are valid
4. Test with the examples provided in this guide

## Conclusion

The new APM API provides a more robust and flexible foundation for alternative payment methods. While the migration requires some code changes, the improved error handling, better event system, and enhanced configuration options make it worthwhile.

The key changes to remember:
- Container passed during initialization, not mounting
- Explicit `.initialise()` and `.cleanUp()` lifecycle methods
- Instance-level events instead of global events
- Expanded configuration options for better control
- Separate flows for authorization vs tokenization

Take your time with the migration and test thoroughly to ensure all functionality works as expected in your specific use case. 