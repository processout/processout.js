import { createMachine } from 'xstate';

export enum AvailableViews {
  FormView = 'FormView',
  PendingView = 'PendingView',
  SuccessView = 'SuccessView',
  ErrorView = 'ErrorView',
}

export enum AvailableEvents {
  Submit = 'SUBMIT',
  Success = 'SUCCESS',
  Error = 'ERROR',
  Retry = 'RETRY',
  GoBack = 'GO_BACK',
}

export const viewsMachine = createMachine({
  initial: AvailableViews.FormView,
  states: {
    [AvailableViews.FormView]: {
      on: {
        [AvailableEvents.Submit]: AvailableViews.PendingView,
      },
    },
    [AvailableViews.PendingView]: {
      on: {
        [AvailableEvents.Success]: AvailableViews.SuccessView,
        [AvailableEvents.Error]: AvailableViews.ErrorView,
        [AvailableEvents.GoBack]: AvailableViews.FormView,
      },
    },
    [AvailableViews.SuccessView]: {
      on: {
        [AvailableEvents.GoBack]: AvailableViews.FormView,
      },
    },
    [AvailableViews.ErrorView]: {
      on: {
        [AvailableEvents.Retry]: AvailableViews.FormView,
      },
    },
  },
});
