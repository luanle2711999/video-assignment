import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock services and child components to keep tests focused
jest.mock('../../services/videos', () => ({
  getVideos: jest.fn(),
}));

// make debounce a passthrough so filtering is immediate in tests
jest.mock('../../hooks/useDebounce', () => ({
  useDebounce: (v: any) => v,
}));

// Mock VideosTable to render the video names so we can assert on them
jest.mock('./VideosTable', () => {
  const React = require('react');
  return {
    VideosTable: ({ videos }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'videos-table-mock' },
        videos?.map((v: any) => React.createElement('div', { key: v.id }, v.name))
      ),
  };
});

// Mock ModalAddVideo to render a simple marker when open
jest.mock('./ModalAddVideo/ModalAddAndUpdateVideo', () => {
  const React = require('react');
  return {
    ModalAddVideo: ({ open }: any) => (open ? React.createElement('div', { 'data-testid': 'modal-open' }) : null),
  };
});

// Require modules after mocks so the mocks take effect
const { getVideos } = require('../../services/videos');
const HomePage = require('./HomePage').default;

const sampleVideos = [
  { id: 1, name: 'Alpha', author: 'A', categories: ['T'], highestQualityFormat: 'one 1080p', releaseDate: '2020-01-01' },
  { id: 2, name: 'Bravo', author: 'B', categories: ['C'], highestQualityFormat: 'two 720p', releaseDate: '2021-02-02' },
];

describe('HomePage', () => {
  beforeEach(() => {
    (getVideos as jest.Mock).mockResolvedValue(sampleVideos);
  });

  afterEach(() => jest.clearAllMocks());

  it('fetches and displays videos and renders main UI elements', async () => {
    render(<HomePage />);

    // title and Add button
    expect(screen.getByRole('heading', { name: /VManager Demo v0.0.1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add video/i })).toBeInTheDocument();

    // search input
    expect(screen.getByPlaceholderText('Search videos...')).toBeInTheDocument();

    // VideosTable mock should show both videos after fetch
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
  });

  it('filters videos based on search input', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    // wait for initial fetch
    expect(await screen.findByText('Alpha')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Search videos...');
    await user.type(input, 'bra');

    // Bravo should remain, Alpha should not be in the filtered results
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
  });

  it('opens the add modal when Add video is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const addBtn = screen.getByRole('button', { name: /Add video/i });
    await user.click(addBtn);

    expect(screen.getByTestId('modal-open')).toBeInTheDocument();
  });
});
