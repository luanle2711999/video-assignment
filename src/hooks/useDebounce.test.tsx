import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import React from 'react';
import { useDebounce } from './useDebounce';

function TestHost({ value, delay }: { value: string; delay?: number }) {
  const debounced = useDebounce<string>(value, delay);
  return <div data-testid="debounced">{debounced}</div>;
}

describe('useDebounce', () => {
  afterEach(() => {
    // ensure timers restored between tests
    jest.useRealTimers();
  });

  it('debounces value changes by the given delay', () => {
    jest.useFakeTimers();

    const { rerender } = render(<TestHost value="first" delay={500} />);

    // initial value is immediate
    expect(screen.getByTestId('debounced')).toHaveTextContent('first');

    // update value; debounced value should remain unchanged until timer elapses
    rerender(<TestHost value="second" delay={500} />);
    expect(screen.getByTestId('debounced')).toHaveTextContent('first');

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(screen.getByTestId('debounced')).toHaveTextContent('first');

    act(() => {
      jest.advanceTimersByTime(1);
    });

    // now the debounced value should update
    expect(screen.getByTestId('debounced')).toHaveTextContent('second');
  });

  it('updates immediately when delay is 0', () => {
    jest.useFakeTimers();

    const { rerender } = render(<TestHost value="a" delay={0} />);
    expect(screen.getByTestId('debounced')).toHaveTextContent('a');

    rerender(<TestHost value="b" delay={0} />);

    // advancing timers by 0 to flush any pending timeout
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByTestId('debounced')).toHaveTextContent('b');
  });
});
