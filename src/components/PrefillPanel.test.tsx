import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_BLUEPRINT } from '../api/mock-data';
import { BlueprintProvider } from '../context/BlueprintContext';
import { FormList } from './FormList';
import { PrefillPanel } from './PrefillPanel';

vi.mock('../api/client', () => ({
  fetchBlueprint: () => Promise.resolve(MOCK_BLUEPRINT),
}));

function renderWithProvider() {
  return render(
    <BlueprintProvider>
      <FormList />
      <PrefillPanel />
    </BlueprintProvider>,
  );
}

describe('PrefillPanel', () => {
  it('shows placeholder when no form is selected', async () => {
    renderWithProvider();
    expect(
      await screen.findByText('Select a form to configure prefill mappings'),
    ).toBeInTheDocument();
  });

  it('shows form name and fields when a form is selected', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));
    expect(screen.getByText('Prefill configuration')).toBeInTheDocument();

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
  });

  it('does not show button field type', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));

    const fieldLabels = screen
      .getAllByRole('listitem')
      .map((el) => el.textContent);
    const hasButton = fieldLabels.some((label) => label === 'Button');
    expect(hasButton).toBe(false);
  });

  it('opens modal when clicking an unmapped field', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));
    await user.click(screen.getByText('Email'));

    expect(screen.getByText('Select data element to map')).toBeInTheDocument();
  });

  it('creates and displays a mapping via the modal', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));
    await user.click(screen.getByText('Email'));

    const modal = await screen.findByRole('dialog');
    const allHeaders = modal.querySelectorAll('.modal__group-header');
    const formBBtn = Array.from(allHeaders).find((el) =>
      el.textContent?.includes('Form B'),
    ) as HTMLButtonElement;
    expect(formBBtn).toBeDefined();
    await user.click(formBBtn);

    const emailOption = screen
      .getAllByText('Email')
      .find((el) => el.closest('.modal__field'));
    expect(emailOption).toBeDefined();
    await user.click(emailOption!);

    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(screen.getByText(/Form B\.email/)).toBeInTheDocument();
  });

  it('clears a mapping when clicking the X button', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await screen.findByText('Form D');

    await user.click(screen.getByText('Form D'));
    await user.click(screen.getByText('Email'));

    const modal = await screen.findByRole('dialog');
    const allHeaders = modal.querySelectorAll('.modal__group-header');
    const formBBtn = Array.from(allHeaders).find((el) =>
      el.textContent?.includes('Form B'),
    ) as HTMLButtonElement;
    await user.click(formBBtn);

    const emailOption = screen
      .getAllByText('Email')
      .find((el) => el.closest('.modal__field'));
    await user.click(emailOption!);
    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(screen.getByText(/Form B\.email/)).toBeInTheDocument();

    const clearButton = screen.getByLabelText('Clear prefill for Email');
    await act(async () => {
      await user.click(clearButton);
    });

    expect(screen.queryByText(/Form B\.email/)).not.toBeInTheDocument();
  });
});
