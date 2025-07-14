module ProcessOut {
  const { div, span } = elements

  // Persistent state store keyed by QR id to survive re-renders
  const copyStateStore: Record<string, {
    isCopying: boolean;
  }> = {};

  // Function to clear QR state when component is removed
  export const clearCopyState = (id: string): void => {
    delete copyStateStore[id];
  };

  // Function to clear all QR state
  export const clearAllCopytate = (): void => {
    Object.keys(copyStateStore).forEach(key => delete copyStateStore[key]);
  };

  export const CopyInstruction = ({ 
    instruction, 
    id = `copy-${Math.random().toString(36).substr(2, 9)}`, 
  }: { 
    instruction: InstructionData['instruction'] & { type: 'message' }, 
    id?: string 
  }) => {
  let copyButtonRef: HTMLButtonElement | null = null;
  let copyTextRef: HTMLSpanElement | null = null;
  let copiedTextRef: HTMLSpanElement | null = null;

  if (!copyStateStore[id]) {
    copyStateStore[id] = {
      isCopying: false,
    };
  }

  const state = copyStateStore[id];

  const update = (): void => { 
    if (state.isCopying) {
      copyButtonRef.disabled = true;
      copiedTextRef.style.display = 'block';
      copyTextRef.style.opacity = '0';
    } else {
      copyButtonRef.disabled = false;
      copiedTextRef.style.display = 'none';
      copyTextRef.style.opacity = '1';
    }
  }

  const onCopy = (): void => {
    if (state.isCopying) {
      return;
    }

    // Update state to copying
    state.isCopying = true;
    update();

    // Emit copy-to-clipboard event immediately (synchronously)
    try {
      ContextImpl.context.events.emit('copy-to-clipboard', { text: instruction.value });
    } catch (error) {
      console.error("Failed to emit copy-to-clipboard event:", error);
    }

    try {
      // Use the modern Clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(instruction.value).then(() => {
          setTimeout(() => {
            state.isCopying = false;
            update();
          }, 1000);
        }).catch((error) => {
          console.error("Failed to copy text to clipboard:", error);
          state.isCopying = false;
          update();
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = instruction.value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setTimeout(() => {
            state.isCopying = false;
            update();
          }, 1000);
        } catch (err) {
          console.error("Fallback copy failed:", err);
          state.isCopying = false;
          update();
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error("Error copying QR code:", error);
      state.isCopying = false;
      update();
    }
  };
  

    return div({ className: 'copy-instruction' },
      div({ className: 'content' },
        div({ className: 'label' }, instruction.label),
        div({ className: 'value' }, instruction.value),
      ),
      Button({
        variant: "secondary",
        size: "sm",
        type: "button",
        onclick: onCopy,
        ref: (element: HTMLButtonElement | null) => {
          copyButtonRef = element;
          
          if (copyButtonRef) {
            update();
          }
        }
      }, 
        span({ ref: (element: HTMLSpanElement | null) => {
          copyTextRef = element;
        }}, "Copy code"),
        span({ className: 'copied-text', ref: (element: HTMLSpanElement | null) => {
          copiedTextRef = element;
        }}, "Copied!")
      ),
    )
  }
}   