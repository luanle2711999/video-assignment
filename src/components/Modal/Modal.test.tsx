import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders when open and shows title, body and footer buttons', () => {
    render(
      <Modal open title={<div>My Title</div>}>
        <div>Body content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onOk and onCancel when buttons are clicked', async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal open onOk={onOk} onCancel={onCancel} okText="Yes" cancelText="No">
        <div />
      </Modal>
    );

    await user.click(screen.getByText('Yes'));
    expect(onOk).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('No'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clicking the close icon triggers onCancel', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal open onCancel={onCancel} closable>
        <div />
      </Modal>
    );

    // close button has aria-label="Close"
    await user.click(screen.getByLabelText('Close'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clicking the mask triggers onCancel when maskClosable is true', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal open onCancel={onCancel} mask maskClosable>
        <div />
      </Modal>
    );

    const mask = screen.getByTestId('modal-mask');
    expect(mask).toBeTruthy();
    await user.click(mask);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clicking the mask does not trigger onCancel when maskClosable is false', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal open onCancel={onCancel} mask maskClosable={false}>
        <div />
      </Modal>
    );

    const mask = screen.getByTestId('modal-mask');
    expect(mask).toBeTruthy();
    await user.click(mask);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('Escape key triggers onCancel when open', () => {
    const onCancel = jest.fn();

    render(
      <Modal open onCancel={onCancel}>
        <div />
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows confirm loading state and disables OK button', () => {
    render(
      <Modal open confirmLoading okText="Save">
        <div />
      </Modal>
    );

    const okBtn = screen.getByTestId('modal-ok-button');
    expect(okBtn).toBeDisabled();

    const spinner = screen.getByTestId('modal-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('honors destroyOnClose by not rendering when closed', () => {
    const { rerender } = render(
      <Modal open={false} destroyOnClose>
        <div />
      </Modal>
    );

    // when closed and destroyOnClose=true the modal should not be rendered
    expect(screen.queryByRole('dialog')).toBeNull();

    // when opened it should render
    rerender(
      <Modal open destroyOnClose>
        <div />
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls afterClose when open changes to false', () => {
    const afterClose = jest.fn();
    const { rerender } = render(
      <Modal open onCancel={() => {}} afterClose={afterClose}>
        <div />
      </Modal>
    );

    // change open to false
    rerender(
      <Modal open={false} onCancel={() => {}} afterClose={afterClose}>
        <div />
      </Modal>
    );

    // afterClose is called in an effect when open === false
    expect(afterClose).toHaveBeenCalled();
  });

  it('renders inline when getContainer is false', () => {
    render(
      <Modal open getContainer={false}>
        <div>inline</div>
      </Modal>
    );

    expect(screen.getByText('inline')).toBeInTheDocument();
  });
});
