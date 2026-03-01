import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('works as uncontrolled input and updates value on user input', async () => {
    const user = userEvent.setup();
    render(<Input defaultValue="hello" aria-label="input" />);

    const input = screen.getByLabelText('input') as HTMLInputElement;
    expect(input.value).toBe('hello');

    await user.type(input, ' world');
    expect(input.value).toBe('hello world');
  });

  it('behaves as controlled input: fires onChange but value does not change without prop update', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input value="fixed" onChange={handleChange} aria-label="input" />);

    const input = screen.getByLabelText('input') as HTMLInputElement;
    expect(input.value).toBe('fixed');

    await user.type(input, 'x');
    expect(handleChange).toHaveBeenCalled();
    // controlled value should stay the same until parent updates prop
    expect(input.value).toBe('fixed');
  });

  it('shows clear button when allowClear is true and clears uncontrolled value', async () => {
    const user = userEvent.setup();

    render(<Input defaultValue="abc" allowClear aria-label="input" />);

    const input = screen.getByLabelText('input') as HTMLInputElement;
    expect(input.value).toBe('abc');

    const clearBtn = screen.getByRole('button');
    await user.click(clearBtn);

    expect(input.value).toBe('');
  });

  it('does not show clear button when disabled', () => {
    render(<Input defaultValue="abc" allowClear disabled aria-label="input" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders prefix and suffix elements', () => {
    render(<Input prefix={<span>PRE</span>} suffix={<span>SUF</span>} aria-label="input" />);

    expect(screen.getByText('PRE')).toBeInTheDocument();
    expect(screen.getByText('SUF')).toBeInTheDocument();
  });

  it('renders addonBefore and addonAfter wrappers', () => {
    render(<Input addonBefore={<span>BEFORE</span>} addonAfter={<span>AFTER</span>} aria-label="input" />);

    expect(screen.getByText('BEFORE')).toBeInTheDocument();
    expect(screen.getByText('AFTER')).toBeInTheDocument();
  });
});
