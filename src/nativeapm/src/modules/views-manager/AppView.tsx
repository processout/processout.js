import { Container } from '../../components';
import { AvailableViews } from './store/machines';
import { ViewsStoreProvider } from './store/providers';
import { ErrorView, FormView, PendingView, SuccessView } from './views';

const AppView = () => {
  return (
    <Container>
      <ViewsStoreProvider
        // eslint-disable-next-line
        renderView={(currentView: any) => {
          switch (true) {
            case currentView.matches(AvailableViews.FormView):
            default:
              return <FormView />;
            case currentView.matches(AvailableViews.PendingView):
              return <PendingView />;
            case currentView.matches(AvailableViews.SuccessView):
              return <SuccessView />;
            case currentView.matches(AvailableViews.ErrorView):
              return <ErrorView />;
          }
        }}
      />
    </Container>
  );
};

export default AppView;
