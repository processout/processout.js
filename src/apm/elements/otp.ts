module ProcessOut {
  const { div, label } = elements

  export interface OTPProps {
    name: string;
    length: number;
    type?: 'text' | 'numeric';
    onComplete?: (key: string, otp: string) => void;
  }

  const state = {
    values: null,
    focusedIndex: 0,
  };

  let inputRefs: HTMLInputElement[] = [];

  export const OTP = ({ name, length, type = 'text', onComplete }: OTPProps): HTMLElement => {
    /**
     * Synchronizes the DOM to match the current state. This function is the single
     * source of truth for how the inputs should appear.
     */
    const update = (): void => {
      state.values.forEach((value, index) => {
        const input = inputRefs[index];
        if (!input) return;

        // Update the input's value from state.
        input.value = value;

        // Update styling and attributes based on the single source of truth: the state object.
        const elWrapper = input.parentElement; // Assuming Input component has a wrapper

        if (value) {
          elWrapper?.classList.add('filled');
        } else {
          elWrapper?.classList.remove('filled');
        }

        // The `disabled` state is now handled by the declarative blueprint, but we can
        // still manage classes here if needed.
        if (index === state.focusedIndex) {
          elWrapper?.classList.remove('disabled');
          input.removeAttribute('disabled');
        } else {
          input.setAttribute('disabled', '');
          elWrapper?.classList.add('disabled');
        }
      });

      // Set focus based on the state.
      inputRefs[state.focusedIndex]?.focus();

      // Check for completion.
      if (onComplete && state.values.every(v => v)) {
        onComplete(name, state.values.join(''));
      }
    };

    /**
     * Handles user input, including pasting, for single-character changes.
     */
    const handleOnChange = (index: number, value: string): void => {
      const currentValue = value.trim();
      const isNumeric = type === 'numeric';

      // -- SCENARIO 1: Handle pasting a full code --
      if (currentValue.length === length) {
        const cleaned = isNumeric ? currentValue.replace(/[^0-9]/g, '') : currentValue;
        if (cleaned.length === length) {
          state.values = cleaned.split('');
          state.focusedIndex = length - 1;
          update();
          return;
        }
      }

      const char = currentValue[0];
      const isAllowed = isNumeric ? /^[0-9]$/.test(char) : true;

      if (isAllowed && char) {
        state.values[index] = char;
        // Move focus to the next input if this one is filled and not the last.
        if (index < length - 1) {
          state.focusedIndex = index + 1;
        }
      } else {
        // If the input is invalid or empty, we ensure the state reflects that.
        // The update call will then reset the input's value to this empty string.
        state.values[index] = '';
      }

      update();
    };

    /**
     * Handles backspace for clearing the current input or moving focus backward.
     */
    const handleKeyDown = (index: number, e: KeyboardEvent): void => {
      if (e.key !== 'Backspace') return;

      e.preventDefault();
      if (state.values[index]) {
        // If the current input has a value, just clear it and stay focused.
        state.values[index] = '';
      } else if (index > 0) {
        // If the current input is already empty, move focus to the previous one.
        state.focusedIndex = index - 1;
        state.values[state.focusedIndex] = ''
      }
      update();
    };

    const handleWrapperClick = (e: MouseEvent): void => {
      if ((e.target as HTMLElement).tagName !== 'INPUT') {
        inputRefs[state.focusedIndex]?.focus();
      }
    };

    state.values = state.values || new Array<string>(length).fill('');
    inputRefs.length = 0;

    const inputs = new Array(length).fill(0).map((_, i) => {
      return Input({
        name: `${name}-${i + 1}`,
        oninput: (_, value: string) => handleOnChange(i, value),
        onkeydown: (e: KeyboardEvent) => handleKeyDown(i, e),
        disabled: i !== state.focusedIndex,
        value: state.values[i],
        id: `${name}-${i + 1}`,
        type: "text", // Use 'text' to allow single char input, pattern for numbers
        pattern: type === "numeric" ? "\\d*" : undefined,
        autocomplete: i === 0 ? "one-time-code" : "off",
        inputMode: type === "numeric" ? "numeric" : undefined,
        ref: liveNode => {
          if (liveNode) {
            inputRefs[i] = liveNode
          }
        },
      })
    });

    // Return the final element tree.
    return div(label({ className: 'otp', onclick: handleWrapperClick }, ...inputs));
  };
}
