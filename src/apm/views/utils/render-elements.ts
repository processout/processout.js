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

  // Generic grouping function that can be reused anywhere
  export const createGroupedElements = <T>(
    items: T[],
    getGroup: (item: T) => { type: string, className?: string } | null,
    renderItem: (item: T) => VNode,
  ): VNode[] => {
    const result: VNode[] = []
    let currentGroup: VNode[] = []
    let inGroup = false
    let currentGroupInfo: { type: string, className?: string } | null = null
    const containerClassName = 'group'

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const nextItem = items[i + 1]
      
      const groupInfo = getGroup(item);
      const groupType = groupInfo && groupInfo.type;
      
      let nextGroup = null
      let nextGroupType = null

      if (nextItem) {
        nextGroup = getGroup(nextItem)
      }

      if (nextGroup) {
        nextGroupType = nextGroup.type
      }
 
      const renderedElement = renderItem(item)

      if (!groupType) {
        if (inGroup) {
          const className = [containerClassName, currentGroupInfo.className].filter(Boolean).join(' ')
          result.push(div({ className }, ...currentGroup))
          currentGroup = []
          inGroup = false
          currentGroupInfo = null
        }

        result.push(renderedElement)
        continue
      }

      if (!inGroup || currentGroupInfo && currentGroupInfo.type !== groupType) {
        // Close any existing group if we're starting a different group type
        if (inGroup) {
          result.push(div({ className: containerClassName }, ...currentGroup))
        }
        
        // Start new group
        inGroup = true
        currentGroupInfo = groupInfo
        currentGroup = [renderedElement]
      } else {
        // Add to existing group (same type)
        currentGroup.push(renderedElement)
      }

      // Close group if next element is different type or shouldn't be grouped
      if (nextGroupType !== groupType) {
        const className = [containerClassName, currentGroupInfo.className].filter(Boolean).join(' ')
        result.push(div({ className }, ...currentGroup))
        currentGroup = []
        inGroup = false
        currentGroupInfo = null
      }
    }

    // Close any remaining group
    if (inGroup && currentGroup.length > 0) {
      const className = [containerClassName, currentGroupInfo.className].filter(Boolean).join(' ')
      result.push(div({ className }, ...currentGroup))
    }

    return result
  }

  const getGroupInfo = (
    element: APIElements<FormFieldResult>[number],
  ): { type: string, className?: string } | null => {
    if (element.type === 'instruction' && 
        element.instruction.type === 'message' && 
        element.instruction.label) {
      return {
        type: 'copy',
      }
    }

    return null
  }

  export const renderElements = (elements: APIElements<FormFieldResult>, options?: {
    state?: NextStepState,
    setState?: (setter: NextStepState | ((prevState: DeepReadonly<NextStepState>) => NextStepState)) => void
    handleSubmit?: () => void
  }): VNode[] => {
    if (!elements || !Array.isArray(elements)) {
      return []
    }
    
    return createGroupedElements(
      elements,
      getGroupInfo,
      (element) => renderElement(
        {
          ...element,
          setState: options && options.setState || (() => {}),
          handleSubmit: options && options.handleSubmit || (() => {}),
        },
        options && options.state || { loading: false }
      ),
    )
  }
}
