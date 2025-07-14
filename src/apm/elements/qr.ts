module ProcessOut {
  const { div } = elements

  export interface QRProps extends Props<'div'> {
    data: string;
    size?: number;
    errorMessage?: string;
    downloadFilename?: string;
    id?: string;
  }

  // QR component state interface
  interface QRComponentState {
    isDownloading: boolean;
    isCopying: boolean;
    canvas: HTMLCanvasElement | null;
  }

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

    // Use the new component state system
    const { state, setState } = useComponentState<QRComponentState>({
      isDownloading: false,
      isCopying: false,
      canvas: null,
    });
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
          // Only enable download button if canvas is available
          downloadButtonRef.disabled = !state.canvas;
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
      setState(prevState => ({ ...prevState, isDownloading: true }));
      update();

      try {
        // Convert canvas to blob
        state.canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas");
            setState(prevState => ({ ...prevState, isDownloading: false }));
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
          
          // Emit download-image event
          ContextImpl.context.events.emit('download-image');
          
          setTimeout(() => {
            setState(prevState => ({ ...prevState, isDownloading: false }));
            update();
          }, 1000);

        }, 'image/png');
      } catch (error) {
        console.error("Error downloading QR code:", error);
        setState(prevState => ({ ...prevState, isDownloading: false }));
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

          // Check if QR data has changed to prevent unnecessary re-renders
          const dataHash = simpleHash(data + size.toString()) // Include size in hash
          const currentDataHash = domElement.getAttribute('data-qr-hash')
          if (currentDataHash === dataHash) {
            return // Data hasn't changed, skip re-render
          }

          // Store current data hash for comparison
          domElement.setAttribute('data-qr-hash', dataHash)

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
                  setState(prevState => ({ ...prevState, canvas }));
                }
                update();
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