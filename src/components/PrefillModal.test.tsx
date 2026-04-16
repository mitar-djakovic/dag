import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_BLUEPRINT } from '../api/mock-data';
import { BlueprintProvider } from '../context/BlueprintContext';
import { PrefillModal } from './PrefillModal';

vi.mock('../api/client', () => ({
  fetchBlueprint: () => Promise.resolve(MOCK_BLUEPRINT),
}));

const NODE_ID_FORM_D = 'form-0f58384c-4966-4ce6-9ec2-40b96d61f745';

function renderModal(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <BlueprintProvider>
        <PrefillModal
          nodeId={NODE_ID_FORM_D}
          fieldKey="email"
          fieldLabel="Email"
          onClose={onClose}
        />
      </BlueprintProvider>,
    ),
  };
}

describe('PrefillModal', () => {
  it('renders with correct title', async () => {
    renderModal();
    expect(
      await screen.findByText('Select data element to map'),
    ).toBeInTheDocument();
  });

  it('shows the target field label', async () => {
    renderModal();
    expect(await screen.findByText(/Email/)).toBeInTheDocument();
  });

  it('shows global data sources', async () => {
    renderModal();
    expect(await screen.findByText('Action Properties')).toBeInTheDocument();
    expect(
      screen.getByText('Client Organisation Properties'),
    ).toBeInTheDocument();
  });

  it('shows upstream form sources for Form D', async () => {
    renderModal();
    expect(await screen.findByText('Form B')).toBeInTheDocument();
    expect(screen.getByText('Form A')).toBeInTheDocument();
  });

  it('expands a group to show fields', async () => {
    const user = userEvent.setup();
    renderModal();

    const formAHeader = await screen.findByRole('button', {
      name: /Form A/,
    });
    await user.click(formAHeader);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
  });

  it('filters groups by search term', async () => {
    const user = userEvent.setup();
    renderModal();

    const searchInput = await screen.findByPlaceholderText('Search');
    await user.type(searchInput, 'Organisation');

    expect(
      screen.getByText('Client Organisation Properties'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Form B')).not.toBeInTheDocument();
  });

  it('select button is disabled when nothing is selected', async () => {
    renderModal();
    const selectBtn = await screen.findByRole('button', { name: 'Select' });
    expect(selectBtn).toBeDisabled();
  });

  it('enables select button after choosing a field', async () => {
    const user = userEvent.setup();
    renderModal();

    const actionHeader = await screen.findByRole('button', {
      name: /Action Properties/,
    });
    await user.click(actionHeader);
    await user.click(screen.getByText('Action Name'));

    expect(screen.getByRole('button', { name: 'Select' })).toBeEnabled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await screen.findByText('Select data element to map');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await screen.findByText('Select data element to map');
    const overlay = document.querySelector('.modal-overlay')!;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows preview when a field is selected', async () => {
    const user = userEvent.setup();
    renderModal();

    const actionHeader = await screen.findByRole('button', {
      name: /Action Properties/,
    });
    await user.click(actionHeader);
    await user.click(screen.getByText('Action Name'));

    expect(
      screen.getByText('Action Properties.action_name'),
    ).toBeInTheDocument();
  });
});
