module ProcessOut {
  const { div, label: labelEl, input } = elements

  export interface OTPProps {
    name: string;
    length: number;
    type?: 'text' | 'numeric';
    disabled?: boolean;
    errored?: boolean;
    value?: string;
    label?: string;
    onComplete?: (key: string, otp: string) => void;
  }

  export const OTP = ({ label, name, length, type = 'text', disabled, errored, onComplete, value }: OTPProps): VNode => {
    const { state, setState, watch } = useComponentState({
      values: new Array<string>(length).fill(''),
      focusedIndex: 0,
      isComplete: false,
    });

    // Watch for focusedIndex changes to handle focus
    watch('focusedIndex', (newIndex) => {
      const targetInput = inputRefs[newIndex];
      if (targetInput) {
        targetInput.focus();
      }
    });

    let inputRefs: HTMLInputElement[] = [];
  
    // Check for completion - only call onComplete once per completion
    const isCurrentlyComplete = state.values.every(v => v);

    if (isCurrentlyComplete && !value) {
      onComplete && onComplete(name, state.values.join(''));
    }
    /**
     * Synchronizes the DOM to match the current state. This function is the single
     * source of truth for how the inputs should appear.
     */
    const update = (newState: typeof state): void => {
      const isComplete = newState.values.every(v => v);
      let isCurrentlyComplete = newState.isComplete;

      if (onComplete && isComplete && !isCurrentlyComplete) {
        isCurrentlyComplete = true;
        onComplete(name, newState.values.join(''));
      } else if (!isComplete && isCurrentlyComplete) {
        isCurrentlyComplete = false;
      }

      setState({
        ...newState,
        isComplete: isCurrentlyComplete,
      });
    };

    /**
     * Handles paste events to allow full OTP codes to be pasted
     */
    const handlePaste = (index: number, e: ClipboardEvent): void => {
      e.preventDefault();
      const pastedText = e.clipboardData && e.clipboardData.getData('text') || '';
      const currentValue = pastedText.trim();
      const isNumeric = type === 'numeric';

      // Handle pasting a full code
      let cleaned;
      if (isNumeric) {
        cleaned = currentValue.replace(/[^0-9]/g, '');
      } else {
        cleaned = currentValue;
      }
      
      if (cleaned.length === length) {
        update({
          ...state,
          values: cleaned.slice(0, length).split(''),
          focusedIndex: length - 1,
        });
        return;
      }
    };

    /**
     * Handles user input - single character or autocomplete
     */
    const handleOnChange = (index: number, value: string): void => {
      const currentValue = value.trim();
      const isNumeric = type === 'numeric';

      // Handle autocomplete/multiple characters (like SMS OTP autocomplete)
      if (currentValue.length === length) {
        let cleaned;
        if (isNumeric) {
          cleaned = currentValue.replace(/[^0-9]/g, '');
        } else {
          cleaned = currentValue;
        }
        
        // If it's a full OTP code, distribute it across all inputs
        if (cleaned.length === length) {
          update({
            ...state,
            values: cleaned.split(''),
            focusedIndex: length - 1,
          });
          return;
        }
        
        // Handle partial autocomplete
        const newValues = [...state.values];
        let newFocusedIndex = index;

        for (let i = 0; i < cleaned.length && index + i < length; i++) {
          newValues[index + i] = cleaned[i];
          newFocusedIndex = index + i;
        }

        // Move focus to next empty input or last filled input
        if (newFocusedIndex < length - 1) {
          newFocusedIndex++;
        }

        update({
          ...state,
          values: newValues,
          focusedIndex: newFocusedIndex
        });
        return;
      }

      // Handle single character input
      const char = currentValue[0];
      let isAllowed;
      if (isNumeric) {
        isAllowed = /^[0-9]$/.test(char);
      } else {
        isAllowed = true;
      }
      let newValues = [...state.values];
      let newFocusedIndex = state.focusedIndex;

      if (isAllowed && char) {
        newValues[index] = char;
        // Move focus to the next input if this one is filled and not the last.
        if (index < length - 1) {
          newFocusedIndex = index + 1;
        }
      } else {
        // If the input is invalid or empty, we ensure the state reflects that.
        newValues[index] = '';
      }

      const inputRef = inputRefs[index];
      
      if (inputRef) {
        inputRef.value = char;
      }

      update({
        ...state,
        values: newValues,
        focusedIndex: newFocusedIndex
      });
    };

    /**
     * Handles backspace for clearing the current input or moving focus backward.
     */
    const handleKeyDown = (index: number, e: KeyboardEvent): void => {
      if (e.key !== 'Backspace') return;

      e.preventDefault();
      let newValues = [...state.values];
      let newFocusedIndex = state.focusedIndex;
      if (newValues[index]) {
        // If the current input has a value, just clear it and stay focused.
        newValues[index] = '';
      } else if (index > 0) {
        // If the current input is already empty, move focus to the previous one.
        newFocusedIndex = index - 1;
        newValues[newFocusedIndex] = '';
      }
      update({
        ...state,
        values: newValues,
        focusedIndex: newFocusedIndex,
      });
    };

    const handleHiddenFocus = (e: FocusEvent): void => {
      e.preventDefault()
      inputRefs[state.focusedIndex] && inputRefs[state.focusedIndex].focus();
    };

    inputRefs.length = 0;

    const inputs = new Array(length).fill(0).map((_, i) => {
      let maxlength, pattern, autocomplete, inputMode;
      
      if (i === 0) {
        maxlength = undefined;
        autocomplete = "one-time-code";
      } else {
        maxlength = 1;
        autocomplete = "off";
      }
      
      if (type === "numeric") {
        pattern = "\\d*";
        inputMode = "numeric";
      } else {
        pattern = undefined;
        inputMode = undefined;
      }
      
      return Input({
        name: `${name}-${i + 1}`,
        oninput: (_, value: string) => handleOnChange(i, value),
        onkeydown: (e: KeyboardEvent) => handleKeyDown(i, e),
        onpaste: (e: ClipboardEvent) => handlePaste(i, e),
        disabled: disabled || i !== state.focusedIndex,
        errored: errored,
        value: state.values[i],
        id: `${name}-${i + 1}`,
        type: "text", // Use 'text' to allow input, pattern for numbers
        maxlength: maxlength,
        pattern: pattern,
        autocomplete: autocomplete,
        inputMode: inputMode,
        ref: liveNode => {
          if (liveNode) {
            inputRefs[i] = liveNode
          }
        },
      })
    });

    // Return the final element tree.
    let labelElement;
    if (label) {
      labelElement = Header({ title: label, tag: 'label', className: 'otp-label', htmlFor: name }, label);
    } else {
      labelElement = null;
    }
    
    return div({ className: 'otp-container' },
      labelElement,
      div(
        labelEl(
          { className: 'otp', htmlFor: name }, 
          ...inputs, 
          input({ className: 'hidden', type: 'text', name, id: name, tabindex: -1, onfocus: handleHiddenFocus })
        )
      )
    );
  };
}
