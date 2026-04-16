import { FormList } from './components/FormList';
import { PrefillPanel } from './components/PrefillPanel';
import { BlueprintProvider, useBlueprint } from './context/BlueprintContext';

import './App.css';

function AppContent() {
  const { loading, error } = useBlueprint();

  if (loading) {
    return (
      <div className="app-status">
        <div className="spinner" />
        <p>Loading blueprint...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-status app-status--error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <FormList />
      <main className="app-layout__main">
        <PrefillPanel />
      </main>
    </div>
  );
}

function App() {
  return (
    <BlueprintProvider>
      <div className="app">
        <header className="app-header">
          <h1>Journey Builder</h1>
          <span className="app-header__badge">Prefill Configuration</span>
        </header>
        <AppContent />
      </div>
    </BlueprintProvider>
  );
}

export default App;
