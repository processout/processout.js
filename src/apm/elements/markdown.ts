module ProcessOut {
  const { div } = elements

  export interface MarkdownProps extends Props<'div'> {
    content: string | string[];
  }

  export const Markdown = ({ content, className, ...props }: MarkdownProps) => {
    const classNames = ["markdown", className].filter(Boolean).join(" ")
    
    // Process content to ensure proper paragraph breaks
    const contentString = Array.isArray(content) 
      ? content.map(line => {
          // Empty strings or strings with only whitespace should create paragraph breaks
          if (line.trim() === '' || line.trim() === ' ') {
            return '\n' // This will become double newline when joined
          }
          return line
        }).join('\n')
      : content

    // Create skeleton elements to show while loading
    const createSkeleton = () => {
      const skeletonContainer = document.createElement('div')
      skeletonContainer.className = 'markdown-skeleton'
      
      // Create skeleton lines of varying widths
      const lines = [90, 75, 85, 60, 80] // Percentages
      lines.forEach(width => {
        const line = document.createElement('div')
        line.className = 'skeleton-line'
        line.style.width = `${width}%`
        line.style.height = '1em'
        line.style.marginBottom = '0.5em'
        line.style.backgroundColor = ThemeImpl.mode === 'light' 
          ? ThemeImpl.instance.get('palette.light.text.default')
          : ThemeImpl.instance.get('palette.dark.text.default')
        line.style.opacity = '0.1'
        line.style.borderRadius = '4px'
        line.style.animation = 'skeleton-pulse 1.5s ease-in-out infinite'
        skeletonContainer.appendChild(line)
      })
      
      return skeletonContainer
    }

    return div({
      className: classNames,
      ref: (domElement: HTMLDivElement | null) => {
        if (!domElement) return

        // Check if content has changed to prevent unnecessary re-renders
        const contentHash = simpleHash(contentString)
        const currentContentHash = domElement.getAttribute('data-content-hash')
        if (currentContentHash === contentHash) {
          return // Content hasn't changed, skip re-render
        }

        // Store current content hash for comparison
        domElement.setAttribute('data-content-hash', contentHash)

        // Show skeleton immediately
        domElement.innerHTML = ''
        domElement.appendChild(createSkeleton())

        const renderMarkdown = () => {
          try {
            if (window.globalThis && window.globalThis.showdown && window.globalThis.showdown.Converter) {
              const converter = new window.globalThis.showdown.Converter()

              converter.setFlavor('github');
              converter.setOption('openLinksInNewWindow', true);
              
              const html = converter.makeHtml(contentString)
              
              // Replace skeleton with actual content
              domElement.innerHTML = html
            } else {
              // Fallback to plain text if library not loaded
              domElement.innerHTML = ''
              domElement.textContent = contentString
            }
          } catch (error) {
            console.error("Error rendering markdown:", error)
            domElement.innerHTML = ''
            domElement.textContent = contentString
          }
        }

        ContextImpl.context.page.loadScript("showdown", "/js/libraries/showdown.min.js", function(error) {
          if (error) {
            console.error("Failed to load markdown library:", error)
            domElement.innerHTML = ''
            domElement.textContent = contentString
          } else {
            renderMarkdown()
          }
        })
      },
      ...props
    })
  }
} 