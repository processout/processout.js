import { AppProviders } from './providers';
import { AppView } from './modules/views-manager';

function App() {
  return (
    <AppProviders>
      <AppView />
    </AppProviders>
  );
}

export default App;
