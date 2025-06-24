module ProcessOut {
  const renderElement = <P extends APIElements<FormFieldResult>[number] = APIElements<FormFieldResult>[number], S extends NextStepState = NextStepState>(
    data: P & {
      setState: (setter: S | ((prevState: DeepReadonly<S>) => S)) => void
      handleSubmit: () => void
    },
    state: S,
  ) => {
    switch (data.type) {
      case "form": {
        const { setState, handleSubmit, ...props } = data
        return Form(props, state, setState, handleSubmit)
      }
      default: {
        return null
      }
    }
  }

  export const renderElements = <S extends NextStepState = NextStepState>(elements: APIElements<FormFieldResult>, options: {
    state: S,
    setState: (setter: S | ((prevState: DeepReadonly<S>) => S)) => void
    handleSubmit: () => void
  }) => {
    return elements.map(element => renderElement(
      {
        ...element,
        setState: options.setState,
        handleSubmit: options.handleSubmit,
      },
      options.state
    ))
  }
}
