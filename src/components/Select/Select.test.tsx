import '@testing-library/jest-dom';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, type SelectOption } from './Select';

describe('Select', () => {
  const options: SelectOption[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
  ];

  it('opens dropdown on click and shows options', async () => {
    const user = userEvent.setup();
    render(<Select options={options} placeholder="Choose" />);

    const root = screen.getByTestId('select-root');
    await user.click(root);

    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('select-option-apple')).toBeInTheDocument();
    expect(screen.getByTestId('select-option-banana')).toBeInTheDocument();
  });

  it('selects an option and calls onChange (single mode)', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Select options={options} onChange={handleChange} />);

    await user.click(screen.getByTestId('select-root'));
    await user.click(screen.getByTestId('select-option-banana'));

    expect(handleChange).toHaveBeenCalledWith('banana', expect.objectContaining({ value: 'banana' }));
    // dropdown should be closed after selection
    await waitFor(() => expect(screen.queryByTestId('select-dropdown')).toBeNull());
  });

  it('shows clear button and clears value on click', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Select options={options} defaultValue="cherry" allowClear onChange={handleChange} />);

    // clear button visible without opening
    const clear = screen.getByTestId('select-clear');
    expect(clear).toBeInTheDocument();

    await user.click(clear);
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('filters options when searching', async () => {
    const user = userEvent.setup();
    render(<Select options={options} showSearch />);

    await user.click(screen.getByTestId('select-root'));
    const search = screen.getByTestId('select-search');
    await user.type(search, 'ch');

    expect(screen.getByTestId('select-option-cherry')).toBeInTheDocument();
    expect(screen.queryByTestId('select-option-apple')).toBeNull();
  });

  it('supports keyboard navigation and selection', async () => {
    render(<Select options={options} />);
    const root = screen.getByTestId('select-root');

    // open via Enter key
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(screen.getByTestId('select-dropdown')).toBeInTheDocument();

    // move to first option and select with Enter
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    fireEvent.keyDown(root, { key: 'Enter' });

    // dropdown should close
    await waitFor(() => expect(screen.queryByTestId('select-dropdown')).toBeNull());
    // label should show selected option
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('multiple mode shows tags and allows removing tag', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Select options={options} mode="multiple" defaultValue={['apple', 'banana']} onChange={handleChange} />);

    // tags rendered
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();

    // remove banana tag
    const closeBtn = screen.getByTestId('tag-close-banana');
    await user.click(closeBtn);

    expect(handleChange).toHaveBeenCalledWith(['apple'], expect.any(Array));
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Select options={options} disabled />);

    await user.click(screen.getByTestId('select-root'));
    expect(screen.queryByTestId('select-dropdown')).toBeNull();
  });

  it('renders dropdown into custom container when getPopupContainer is provided', async () => {
    const user = userEvent.setup();
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'popup-root');
    document.body.appendChild(container);

    render(<Select options={options} getPopupContainer={container} />);

    await user.click(screen.getByTestId('select-root'));

    const withinContainer = within(container);
    expect(await withinContainer.findByTestId('select-option-apple')).toBeInTheDocument();

    container.remove();
  });
});
