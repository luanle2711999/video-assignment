import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock the HomePage module so App renders a simple marker in tests
jest.mock('./pages/HomePage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'home-mock' }, 'Home Mock'),
  };
});

const { App } = require('./App');

describe('App', () => {
  it('renders the HomePage component', () => {
    render(React.createElement(App));
    expect(screen.getByTestId('home-mock')).toBeInTheDocument();
  });
});
