module ProcessOut {
  const { div, label } = elements

  export interface OTPProps {
    length: number;
    type?: 'text' | 'numeric';
    onComplete?: (otp: string) => void;
  }

  export const OTP = ({ length, type = 'text', onComplete }: OTPProps): HTMLElement => {
    const state = {
      values: new Array<string>(length).fill(''),
      focusedIndex: 0,
    };

    const inputRefs: HTMLInputElement[] = [];

    /**
     * Updates all input elements to match the current state.
     * This is the only function that should directly touch the DOM.
     */
    const update = (): void => {
      state.values.forEach((value, index) => {
        const input = inputRefs[index];
        if (!input) {
          return;
        }

        // Update value
        input.value = value;

        // Update styling and attributes based on state
        const elWrapper = input.parentElement;
        if (value) {
          elWrapper?.classList.add('filled');
        } else {
          elWrapper?.classList.remove('filled');
        }

        // Manage disabled state based on focusedIndex
        if (index === state.focusedIndex) {
          input.removeAttribute('disabled');
          elWrapper?.classList.remove('disabled');
        } else {
          input.setAttribute('disabled', 'true');
          elWrapper?.classList.add('disabled');
        }
      });

      // Set focus based on the state
      inputRefs[state.focusedIndex]?.focus();

      // Check for completion
      if (onComplete && state.values.every(v => v !== '')) {
        onComplete(state.values.join(''));
      }
    };

    /** Handles clicks on the main wrapper. */
    const handleWrapperClick = (e: MouseEvent): void => {
      e.preventDefault();
      if ((e.target as HTMLElement).tagName === 'INPUT') {
        return;
      }
      // Otherwise, focus the currently active input.
      inputRefs[state.focusedIndex]?.focus();
    };

    /** Handles pasting and typing. */
    const handleOnChange = (index: number, e: Event): void => {
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();

      const isNumeric = type === 'numeric';
      const isValueAllowed = isNumeric ? /^[0-9]*$/.test(value) : true ;

      if (!value || value.length !== 1 && value.length !== length || !isValueAllowed) {
        update();
        return;
      }

      if (value.length === length) {
        value.split('').forEach((char, i) => {
          state.values[i] = char;
        });
        state.focusedIndex = length - 1;
      } else {
        state.values[index] = value;
        if (value && index < length - 1) {
          state.focusedIndex++;
        }
      }
      update();
    };

    /** Handles backspace for clearing and moving backward. */
    const handleKeyDown = (index: number, e: KeyboardEvent): void => {
      if (e.key !== 'Backspace') {
        return;
      }
      e.preventDefault();

      if (state.values[index]) {
        // If there's a value, just clear it.
        state.values[index] = '';
      } else if (index > 0) {
        // If empty, move focus back and clear the previous input.
        state.focusedIndex--;
        state.values[state.focusedIndex] = '';
      }
      update();
    };

    // --- 4. ELEMENT CREATION ---

    // Create the inputs array using your 'Input' helper.
    // We no longer need to push to a separate 'elements' array as a side effect.
    const inputs = new Array(length).fill(0).map((_, i) => {
      // The `Input` helper function is called here as in your original code.
      const el = Input({
        // We wrap the handlers to pass the index and event object.
        oninput: (e: Event) => handleOnChange(i, e),
        onkeydown: (e: KeyboardEvent) => handleKeyDown(i, e),
        disabled: i !== 0,
        id: `otp-${i + 1}`,
        type: type,
        autocomplete: i === 0 ? 'one-time-code' : 'off',
      });

      // Store a reference to the actual <input> element within the component.
      // This assumes your `Input` component has a single <input> inside.
      const inputElement = el.querySelector('input');
      if (inputElement) {
        inputRefs.push(inputElement);
      }

      return el;
    });

    // Initial focus for hydration on browsers that support it
    setTimeout(() => inputRefs[0]?.focus(), 0);

    // Return the final element tree using your 'label' helper.
    return div(label({ className: 'otp', onclick: handleWrapperClick }, ...inputs));
  };
}
