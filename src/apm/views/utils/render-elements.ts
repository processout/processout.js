module ProcessOut {
  const { div } = elements

  const renderElement = (
    data: APIElements<FormFieldResult>[number] & {
      setState?: (setter: NextStepState | ((prevState: DeepReadonly<NextStepState>) => NextStepState)) => void
      handleSubmit?: () => void
    },
    state: NextStepState,
  ) => {
    switch (data.type) {
      case "form": {
        const { setState, handleSubmit, ...props } = data
        return Form(props, state, setState, handleSubmit)
      }
      case "instruction": {
        const { instruction } = data
        return Instruction({ instruction })
      }
      default: {
        return null
      }
    }
  }

  export const renderElements = (elements: APIElements<FormFieldResult>, options?: {
    state?: NextStepState,
    setState?: (setter: NextStepState | ((prevState: DeepReadonly<NextStepState>) => NextStepState)) => void
    handleSubmit?: () => void
  }): VNode[] => {
    const result: VNode[] = []
    let currentGroup: VNode[] = []
    let inCopyContainer = false

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const nextElement = elements[i + 1]
      
      const isInstructionWithLabel = element.type === 'instruction' && 
        element.instruction.type === 'message' && 
        element.instruction.label

      const nextIsInstructionWithLabel = nextElement?.type === 'instruction' && 
        nextElement.instruction.type === 'message' && 
        nextElement.instruction.label

      const renderedElement = renderElement(
        {
          ...element,
          setState: options?.setState || (() => {}),
          handleSubmit: options?.handleSubmit || (() => {}),
        },
        options?.state || { loading: false }
      )

      if (isInstructionWithLabel) {
        if (!inCopyContainer) {
          // Start new copy container group
          inCopyContainer = true
          currentGroup = [renderedElement]
        } else {
          // Add to existing group
          currentGroup.push(renderedElement)
        }

        // Close group if next element shouldn't be in container
        if (!nextIsInstructionWithLabel) {
          result.push(div({ className: 'copy-container' }, ...currentGroup))
          currentGroup = []
          inCopyContainer = false
        }
      } else {
        // Close any open group
        if (inCopyContainer) {
          result.push(div({ className: 'copy-container' }, ...currentGroup))
          currentGroup = []
          inCopyContainer = false
        }
        
        // Add normal element
        result.push(renderedElement)
      }
    }

    // Close any remaining group
    if (inCopyContainer && currentGroup.length > 0) {
      result.push(div({ className: 'copy-container' }, ...currentGroup))
    }

    return result
  }
}
