import AppProviders from './providers';
import { ErrorView } from './views';

function App() {
  return (
    <AppProviders>
      <ErrorView />
    </AppProviders>
  );
}

export default App;
