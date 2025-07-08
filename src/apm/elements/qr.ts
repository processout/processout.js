module ProcessOut {
  const { div } = elements

  export interface QRProps extends Props<'div'> {
    data: string;
    size?: number;
    errorMessage?: string;
    downloadFilename?: string;
    id?: string;
  }

  // Persistent state store keyed by QR id to survive re-renders
  const qrStateStore: Record<string, {
    isDownloading: boolean;
    isCopying: boolean;
    canvas: HTMLCanvasElement | null;
  }> = {};

  // Function to clear QR state when component is removed
  export const clearQRState = (id: string): void => {
    delete qrStateStore[id];
  };

  // Function to clear all QR state
  export const clearAllQRState = (): void => {
    Object.keys(qrStateStore).forEach(key => delete qrStateStore[key]);
  };

  export const QR = ({ 
    data, 
    size = 128, 
    errorMessage = "Failed to decode QR code",
    downloadFilename = "qr-code.png",
    id = `qr-${Math.random().toString(36).substr(2, 9)}`,
    className, 
    ...props 
  }: QRProps) => {
    if (!data) {
      return div({ className: ["qr-error", className].filter(Boolean).join(" ") }, "No QR code data provided")
    }

    // Get or create persistent state for this QR instance
    if (!qrStateStore[id]) {
      qrStateStore[id] = {
        isDownloading: false,
        isCopying: false,
        canvas: null,
      };
    }

    const state = qrStateStore[id];
    const classNames = ["qr-code-container", className].filter(Boolean).join(" ")
    let downloadButtonRef: HTMLButtonElement | null = null;
    let copyButtonRef: HTMLButtonElement | null = null;

    // Create QR skeleton loader
    const createQRSkeleton = () => {
      const skeletonContainer = document.createElement('div')
      skeletonContainer.className = 'qr-skeleton'
      skeletonContainer.style.width = `${size}px`
      skeletonContainer.style.height = `${size}px`
      
      // Calculate dots based on size - approximately 1 dot per 20px
      const dotsPerRow = Math.max(3, Math.floor(size / 20))
      const dotCount = dotsPerRow * dotsPerRow
      const dotWidth = (100 / dotsPerRow) + '%'
      
      // Create subtle dot pattern
      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div')
        dot.className = 'qr-dot'
        dot.style.width = dotWidth
        
        // Sequential delay - wave effect from top-left to bottom-right
        const row = Math.floor(i / dotsPerRow)
        const col = i % dotsPerRow
        const sequentialDelay = (row * dotsPerRow + col) * 0.05 // 50ms between each dot
        dot.style.setProperty('--animation-delay', `${sequentialDelay}s`)
        
        skeletonContainer.appendChild(dot)
      }
      
      return skeletonContainer
    }

    /**
     * Synchronizes the DOM to match the current state. This function is the single
     * source of truth for how the buttons should appear.
     */
    const update = (): void => {
      // Update download button
      if (downloadButtonRef) {
        if (state.isDownloading) {
          downloadButtonRef.disabled = true;
          downloadButtonRef.classList.add('loading');
          // Create and append loader
          const loader = document.createElement('div');
          loader.className = 'loader';
          downloadButtonRef.appendChild(loader);
        } else {
          downloadButtonRef.disabled = false;
          downloadButtonRef.classList.remove('loading');
          downloadButtonRef.querySelector('.loader')?.remove();
        }
      }

      // Update copy button
      if (copyButtonRef) {
        if (state.isCopying) {
          copyButtonRef.disabled = true;
          copyButtonRef.querySelector('.content').textContent = 'Copied!';
        } else {
          copyButtonRef.disabled = false;
          copyButtonRef.querySelector('.content').textContent = 'Copy code';
        }
      }
    };

    const downloadQR = (): void => {
      if (!state.canvas || state.isDownloading) {
        if (!state.canvas) {
          console.error("QR code canvas not found for download")
        }
        return
      }

      // Update state to loading
      state.isDownloading = true;
      update();

      try {
        // Convert canvas to blob
        state.canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas");
            state.isDownloading = false;
            update();
            return;
          }

          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadFilename;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          URL.revokeObjectURL(url);
          
          setTimeout(() => {
            state.isDownloading = false;
            update();
          }, 1000);

        }, 'image/png');
      } catch (error) {
        console.error("Error downloading QR code:", error);
        state.isDownloading = false;
        update();
      }
    };

    const copyQRCode = (): void => {
      if (state.isCopying) {
        return;
      }

      // Update state to copying
      state.isCopying = true;
      update();

      try {
        // Decode the base64 value to get the actual text
        const text = atob(data);
        
        // Use the modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
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
          textArea.value = text;
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

    return div({
      className: classNames,
      ...props
    }, [
      // QR Code Display
      div({
        className: "qr-code",
        style: {
          width: `${size + 8}px`,
          height: `${size + 8}px`,
        },
        ref: (domElement: HTMLDivElement | null) => {
          if (!domElement) return

          // Show QR skeleton immediately
          domElement.innerHTML = ''
          const skeleton = createQRSkeleton()
          domElement.appendChild(skeleton)

          const createQR = () => {
            try {
              // Decode the base64 value
              const text = atob(data)
              
              if (window.globalThis.QRCode && text) {
                // Clear skeleton and create QR code
                domElement.innerHTML = ''
                
                new window.globalThis.QRCode(domElement, {
                  text,
                  width: size,
                  height: size,
                })

                // Store reference to the canvas in state
                const canvas = domElement.querySelector('canvas')
                if (canvas) {
                  state.canvas = canvas;
                }
              }
            } catch (error) {
              domElement.innerHTML = ''
              domElement.textContent = errorMessage
              domElement.className = domElement.className + " qr-error"
            }
          }

          ContextImpl.context.page.loadScript("qrcode", "/js/libraries/qrcode.min.js", function(error) {
            if (error) {
              domElement.innerHTML = ''
              domElement.textContent = "Failed to load QR code library"
              domElement.className = domElement.className + " qr-error"
            } else {
              createQR()
            }
          })
        }
      }),
      
      div({ className: "qr-actions" }, [
        Button({
          variant: "secondary",
          size: "sm",
          type: "button",
          onclick: copyQRCode,
          ref: (element: HTMLButtonElement | null) => {
            copyButtonRef = element;
            
            if (copyButtonRef) {
              update();
            }
          }
        }, "Copy code"),
        Button({
          variant: "secondary",
          size: "sm",
          type: "button",
          onclick: downloadQR,
          ref: (element: HTMLButtonElement | null) => {
            downloadButtonRef = element;

            if (downloadButtonRef) {
              update();
            }
          }
        }, "Download image"),
      ])
    ])
  }
} 