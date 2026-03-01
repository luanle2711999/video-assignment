import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopConfirm } from './PopConfirm';

describe('PopConfirm', () => {
  it('opens on click trigger and calls onConfirm/onCancel', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <PopConfirm title="Are you sure?" description="Delete item" onConfirm={onConfirm} onCancel={onCancel}>
        <button>Trigger</button>
      </PopConfirm>
    );

    await user.click(screen.getByText('Trigger'));

    expect(await screen.findByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete item')).toBeInTheDocument();

    await user.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // reopen
    await user.click(screen.getByText('Trigger'));
    await user.click(screen.getByText('No'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state while onConfirm promise is pending and closes after resolve', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<void>((res) => {
      resolvePromise = res;
    });
    const onConfirm = jest.fn(() => promise);

    render(
      <PopConfirm title="Confirm" onConfirm={onConfirm}>
        <button>Trigger</button>
      </PopConfirm>
    );

    await user.click(screen.getByText('Trigger'));

    const okBtn = screen.getByRole('button', { name: 'Yes' });
    await user.click(okBtn);

    // OK should be disabled while promise pending
    expect(okBtn).toBeDisabled();

    // resolve the promise and wait for overlay to close
    resolvePromise!();
    await waitFor(() => expect(screen.queryByText('Confirm')).toBeNull());
  });

  it('opens on hover after mouseEnterDelay and closes after mouseLeaveDelay', async () => {
    const user = userEvent.setup();

    render(
      <PopConfirm title="Hover" trigger="hover" mouseEnterDelay={0} mouseLeaveDelay={0}>
        <button>HoverTarget</button>
      </PopConfirm>
    );

    const trigger = screen.getByText('HoverTarget');

    await user.hover(trigger);
    expect(await screen.findByText('Hover')).toBeInTheDocument();

    await user.unhover(trigger);
    await waitFor(() => expect(screen.queryByText('Hover')).toBeNull());
  });

  it('clicking outside closes the overlay', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <PopConfirm title="Outside">
          <button>Trigger</button>
        </PopConfirm>
        <button>OutsideButton</button>
      </div>
    );

    await user.click(screen.getByText('Trigger'));
    expect(await screen.findByText('Outside')).toBeInTheDocument();

    // click outside
    await user.click(screen.getByText('OutsideButton'));
    await waitFor(() => expect(screen.queryByText('Outside')).toBeNull());
  });

  it('renders into custom container when getPopupContainer is provided', async () => {
    const user = userEvent.setup();
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'popup-root');
    document.body.appendChild(container);

    render(
      <PopConfirm title="Custom" getPopupContainer={() => container}>
        <button>Trigger</button>
      </PopConfirm>
    );

    await user.click(screen.getByText('Trigger'));

    // overlay should be rendered inside the custom container
    const withinContainer = within(container);
    expect(await withinContainer.findByText('Custom')).toBeInTheDocument();

    container.remove();
  });

  it('calls onOpenChange when controlled and trigger is clicked', async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup();

    render(
      <PopConfirm title="Ctl" open={false} onOpenChange={onOpenChange}>
        <button>Trigger</button>
      </PopConfirm>
    );

    await user.click(screen.getByText('Trigger'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
