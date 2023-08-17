import { createMachine } from 'xstate';
import { AVAILABLE_EVENTS, emitEvent } from '../../../event-emitter';

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

export const viewsMachine = createMachine(
  {
    initial: AvailableViews.FormView,
    states: {
      [AvailableViews.FormView]: {
        on: {
          [AvailableEvents.Submit]: {
            target: AvailableViews.PendingView,
            actions: ['emitFormSubmitEvent'],
          },
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
          [AvailableEvents.GoBack]: {
            target: AvailableViews.FormView,
            actions: ['emitPaymentSuccessEvent'],
          },
        },
      },
      [AvailableViews.ErrorView]: {
        on: {
          [AvailableEvents.Retry]: {
            target: AvailableViews.FormView,
            actions: ['emitPaymentErrorEvent'],
          },
        },
      },
    },
  },
  {
    actions: {
      emitFormSubmitEvent: () => {
        emitEvent(AVAILABLE_EVENTS.FORM_SUBMIT);
      },
      emitPaymentSuccessEvent: () => {
        emitEvent(AVAILABLE_EVENTS.SUCCESS);
      },
      emitPaymentErrorEvent: () => {
        emitEvent(AVAILABLE_EVENTS.ERROR);
      },
    },
  }
);
