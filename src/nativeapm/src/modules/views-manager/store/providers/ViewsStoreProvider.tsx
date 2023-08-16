import { useMachine } from '@xstate/react';
import * as React from 'react';
import { AvailableEvents, viewsMachine } from '../machines';

type ViewsStoreContextType = {
  currentView: any; // eslint-disable-line
  goToPendingState: () => void;
  goToSuccessState: () => void;
  goToErrorState: () => void;
  goBackToFormView: () => void;
  retryPayment: () => void;
};

export const ViewsStoreContext = React.createContext<ViewsStoreContextType>({
  currentView: null,
  goToPendingState: () => {},
  goToSuccessState: () => {},
  goToErrorState: () => {},
  goBackToFormView: () => {},
  retryPayment: () => {},
});

type ViewsStoreProviderPropsType = {
  renderView(currentView: any): React.ReactNode; // eslint-disable-line
};

const ViewsStoreProvider = ({ renderView }: ViewsStoreProviderPropsType) => {
  const [currentView, send] = useMachine(viewsMachine);

  const goToPendingState = () => send(AvailableEvents.Submit);
  const goToSuccessState = () => send(AvailableEvents.Success);
  const goToErrorState = () => send(AvailableEvents.Error);
  const goBackToFormView = () => send(AvailableEvents.GoBack);
  const retryPayment = () => send(AvailableEvents.Retry);

  const viewsStore = {
    currentView,
    goToPendingState,
    goToSuccessState,
    goToErrorState,
    goBackToFormView,
    retryPayment,
  };
  return (
    <ViewsStoreContext.Provider value={viewsStore}>
      {renderView(currentView)}
    </ViewsStoreContext.Provider>
  );
};

export default ViewsStoreProvider;
