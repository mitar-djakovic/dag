import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_BLUEPRINT } from '../api/mock-data';
import { BlueprintProvider } from '../context/BlueprintContext';
import { FormList } from './FormList';
import { PrefillPanel } from './PrefillPanel';

vi.mock('../api/client', () => ({
  fetchBlueprint: () => Promise.resolve(MOCK_BLUEPRINT),
}));

function renderFormList() {
  return render(
    <BlueprintProvider>
      <FormList />
    </BlueprintProvider>,
  );
}

function renderWithPrefillPanel() {
  return render(
    <BlueprintProvider>
      <FormList />
      <PrefillPanel />
    </BlueprintProvider>,
  );
}

describe('FormList', () => {
  it('renders all form nodes', async () => {
    renderFormList();
    for (const name of [
      'Form A',
      'Form B',
      'Form C',
      'Form D',
      'Form E',
      'Form F',
    ]) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
  });

  it('sorts forms by position (left to right)', async () => {
    renderFormList();
    await screen.findByText('Form A');
    const items = screen.getAllByRole('option');
    const firstItem = items[0];
    expect(within(firstItem).getByText('Form A')).toBeInTheDocument();
  });

  it('shows dependency count badges', async () => {
    renderFormList();
    await screen.findByText('Form A');

    const formFItem = screen.getByText('Form F').closest('[role="option"]')!;
    expect(formFItem.querySelector('.form-list__badge')?.textContent).toBe('2');
  });

  it('does not show badge for root node', async () => {
    renderFormList();
    await screen.findByText('Form A');

    const formAItem = screen.getByText('Form A').closest('[role="option"]')!;
    expect(
      formAItem.querySelector('.form-list__badge'),
    ).not.toBeInTheDocument();
  });

  it('marks selected form with aria-selected', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form B');

    await user.click(screen.getByText('Form B'));
    const listItem = screen.getByText('Form B').closest('[role="option"]')!;
    expect(listItem).toHaveAttribute('aria-selected', 'true');
  });

  it('deselects when clicking the same form again', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form B');

    await user.click(screen.getByText('Form B'));
    await user.click(screen.getByText('Form B'));
    const listItem = screen.getByText('Form B').closest('[role="option"]')!;
    expect(listItem).toHaveAttribute('aria-selected', 'false');
  });

  it('expands to show form properties when chevron is clicked', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form A');

    const expandBtn = screen.getByLabelText('Toggle Form A properties');
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');

    await user.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');

    const formAItem = screen
      .getByText('Form A')
      .closest('[role="option"]') as HTMLElement;
    expect(within(formAItem).getByText('Email')).toBeInTheDocument();
    expect(within(formAItem).getByText('Name')).toBeInTheDocument();
    expect(within(formAItem).getByText('ID')).toBeInTheDocument();
  });

  it('shows field type badge in properties dropdown', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form A');

    await user.click(screen.getByLabelText('Toggle Form A properties'));

    const formAItem = screen
      .getByText('Form A')
      .closest('[role="option"]') as HTMLElement;
    const typeBadges = within(formAItem).getAllByText('short-text');
    expect(typeBadges.length).toBeGreaterThan(0);
    expect(typeBadges[0]).toHaveClass('form-list__prop-type');
  });

  it('marks required fields with an asterisk', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form A');

    await user.click(screen.getByLabelText('Toggle Form A properties'));

    const requiredMarkers = document.querySelectorAll(
      '.form-list__prop-required',
    );
    expect(requiredMarkers.length).toBeGreaterThan(0);
  });

  it('collapses properties when chevron is clicked again', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form A');

    const expandBtn = screen.getByLabelText('Toggle Form A properties');
    await user.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');

    await user.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('expanding properties does not select the form', async () => {
    const user = userEvent.setup();
    renderFormList();
    await screen.findByText('Form A');

    await user.click(screen.getByLabelText('Toggle Form A properties'));

    const listItem = screen.getByText('Form A').closest('[role="option"]')!;
    expect(listItem).toHaveAttribute('aria-selected', 'false');
  });
});

describe('FormList quick-map', () => {
  it('shows quick-map dropdown when clicking an upstream property', async () => {
    const user = userEvent.setup();
    renderWithPrefillPanel();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));

    await user.click(screen.getByLabelText('Toggle Form A properties'));

    const formAItem = screen
      .getByText('Form A')
      .closest('[role="option"]') as HTMLElement;
    const emailBtn = within(formAItem).getByText('Email').closest('button')!;
    await user.click(emailBtn);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText(/Map to field on/)).toBeInTheDocument();
  });

  it('creates a mapping via quick-map', async () => {
    const user = userEvent.setup();
    renderWithPrefillPanel();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));

    await user.click(screen.getByLabelText('Toggle Form A properties'));

    const formAItem = screen
      .getByText('Form A')
      .closest('[role="option"]') as HTMLElement;
    const emailBtn = within(formAItem).getByText('Email').closest('button')!;
    await user.click(emailBtn);

    const quickMapMenu = screen.getByRole('menu');
    const nameOption = within(quickMapMenu).getByText('Name');
    await user.click(nameOption);

    expect(screen.getByText(/Form A\.email/)).toBeInTheDocument();
  });

  it('does not show quick-map when clicking own properties', async () => {
    const user = userEvent.setup();
    renderWithPrefillPanel();
    await screen.findByText('Form D');

    const formList = screen.getByRole('navigation', { name: 'Form list' });
    await user.click(within(formList).getByText('Form D'));

    await user.click(screen.getByLabelText('Toggle Form D properties'));

    const formDItem = within(formList)
      .getByText('Form D')
      .closest('[role="option"]') as HTMLElement;
    const emailBtn = within(formDItem).getByText('Email').closest('button')!;
    expect(emailBtn).toBeDisabled();
  });

  it('does not show quick-map for non-ancestor forms', async () => {
    const user = userEvent.setup();
    renderWithPrefillPanel();
    await screen.findByText('Form D');

    const formList = screen.getByRole('navigation', { name: 'Form list' });
    await user.click(within(formList).getByText('Form D'));

    await user.click(screen.getByLabelText('Toggle Form C properties'));

    const formCItem = screen
      .getByText('Form C')
      .closest('[role="option"]') as HTMLElement;
    const emailBtn = within(formCItem).getByText('Email').closest('button')!;
    expect(emailBtn).toBeDisabled();
  });

  it('closes quick-map via Escape key', async () => {
    const user = userEvent.setup();
    renderWithPrefillPanel();
    await screen.findByText('Form D');

    const formList = screen.getByRole('navigation', { name: 'Form list' });
    await user.click(within(formList).getByText('Form D'));
    await user.click(screen.getByLabelText('Toggle Form A properties'));

    const formAItem = screen
      .getByText('Form A')
      .closest('[role="option"]') as HTMLElement;
    const emailBtn = within(formAItem).getByText('Email').closest('button')!;

    await user.click(emailBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
