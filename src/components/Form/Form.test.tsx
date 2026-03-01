import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from './Form';

describe('Form', () => {
  it('validates required field and calls onFinishFailed', async () => {
    const handleFinish = jest.fn();
    const handleFinishFailed = jest.fn();
    const user = userEvent.setup();

    render(
      <Form onFinish={handleFinish} onFinishFailed={handleFinishFailed}>
        <Form.Item name="username" rules={[{ required: true }]}>
          <input aria-label="username" />
        </Form.Item>
        <button type="submit">Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleFinish).not.toHaveBeenCalled();
    expect(handleFinishFailed).toHaveBeenCalled();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    // verify the error object contains the username key
    const [[errors]] = handleFinishFailed.mock.calls as unknown as [Record<string, string>][];
    expect(errors).toHaveProperty('username');
  });

  it('submits values when validation passes', async () => {
    const handleFinish = jest.fn();
    const handleFinishFailed = jest.fn();
    const user = userEvent.setup();

    render(
      <Form onFinish={handleFinish} onFinishFailed={handleFinishFailed}>
        <Form.Item name="username" rules={[{ required: true }]}>
          <input aria-label="username" />
        </Form.Item>
        <button type="submit">Submit</button>
      </Form>
    );

    await user.type(screen.getByLabelText('username'), 'alice');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleFinishFailed).not.toHaveBeenCalled();
    expect(handleFinish).toHaveBeenCalledWith({ username: 'alice' });
  });

  it('calls onValuesChange when field value changes', async () => {
    const onValuesChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Form onValuesChange={onValuesChange}>
        <Form.Item name="username">
          <input aria-label="username" />
        </Form.Item>
      </Form>
    );

    await user.type(screen.getByLabelText('username'), 'a');

    expect(onValuesChange).toHaveBeenCalled();
    // ensure one of the calls contained the changed value for username
    const calls = onValuesChange.mock.calls;
    expect(calls.some((c) => c[0] && c[0].username === 'a')).toBe(true);
  });
});
