import { createMachine } from 'xstate';

export enum AvailableViews {
  FormView = 'FormView',
  PendingView = 'PendingView',
  SuccessView = 'SuccessView',
  ErrorView = 'ErrorView',
}

export const viewsMachine = createMachine({
  initial: 'FormView',
  states: {
    [AvailableViews.FormView]: {
      on: {
        SUBMIT: AvailableViews.PendingView,
      },
    },
    [AvailableViews.PendingView]: {
      on: {
        SUCCESS: AvailableViews.SuccessView,
        ERROR: AvailableViews.ErrorView,
      },
    },
    [AvailableViews.SuccessView]: {
      on: {
        GO_BACK: AvailableViews.FormView,
      },
    },
    [AvailableViews.ErrorView]: {
      on: {
        RETRY: AvailableViews.FormView,
      },
    },
  },
});
