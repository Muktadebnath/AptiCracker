import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppProvider } from './context/AppContext.jsx';
import { UIProvider } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import { useRoute } from './lib/router.js';

import Dashboard from './pages/Dashboard.jsx';
import Plan from './pages/Plan.jsx';
import Daily from './pages/Daily.jsx';
import Exams from './pages/Exams.jsx';
import Analytics from './pages/Analytics.jsx';
import Topics from './pages/Topics.jsx';
import Settings from './pages/Settings.jsx';

const PAGES = { dashboard: Dashboard, plan: Plan, daily: Daily, exams: Exams, analytics: Analytics, topics: Topics, settings: Settings };

function App() {
  const route = useRoute();
  const Page = PAGES[route.id] || Dashboard;
  return (
    <Layout route={route.id}>
      <Page params={route.params} />
    </Layout>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UIProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </UIProvider>
  </StrictMode>,
);
