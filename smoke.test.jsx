import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../context/AppContext.jsx';
import { UIProvider } from '../components/ui.jsx';
import Layout from '../components/Layout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Plan from '../pages/Plan.jsx';
import Daily from '../pages/Daily.jsx';
import Exams from '../pages/Exams.jsx';
import Analytics from '../pages/Analytics.jsx';
import Topics from '../pages/Topics.jsx';
import Settings from '../pages/Settings.jsx';

function renderPage(id, Page) {
  it(`renders ${id} without crashing`, () => {
    render(
      <UIProvider>
        <AppProvider>
          <Layout route={id}><Page params={{}} /></Layout>
        </AppProvider>
      </UIProvider>
    );
  });
}

describe('pages smoke test', () => {
  renderPage('dashboard', Dashboard);
  renderPage('plan', Plan);
  renderPage('daily', Daily);
  renderPage('exams', Exams);
  renderPage('analytics', Analytics);
  renderPage('topics', Topics);
  renderPage('settings', Settings);
});
