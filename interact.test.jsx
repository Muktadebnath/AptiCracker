import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AppProvider } from '../context/AppContext.jsx';
import { UIProvider } from '../components/ui.jsx';
import Layout from '../components/Layout.jsx';
import Daily from '../pages/Daily.jsx';
import Settings from '../pages/Settings.jsx';

describe('interactions', () => {
  it('can toggle a task complete on Daily (sample data has tasks somewhere, but today may be empty)', () => {
    render(
      <UIProvider><AppProvider><Layout route="daily"><Daily params={{}} /></Layout></AppProvider></UIProvider>
    );
    // Add task flow
    fireEvent.click(screen.getAllByRole('button', { name: /add task/i })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(/extra practice/i), { target: { value: 'Test task xyz' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^add task$/i }));
    expect(screen.getByText('Test task xyz')).toBeTruthy();
  });

  it('settings page saves without crashing', () => {
    render(
      <UIProvider><AppProvider><Layout route="settings"><Settings /></Layout></AppProvider></UIProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));
  });

  it('opening a task edit modal does not crash the app (regression)', () => {
    render(
      <UIProvider><AppProvider><Layout route="daily"><Daily params={{}} /></Layout></AppProvider></UIProvider>
    );
    const rows = screen.getAllByRole('button', { name: /Verbal|Quant|Logical|Mixed/i });
    fireEvent.click(rows[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
