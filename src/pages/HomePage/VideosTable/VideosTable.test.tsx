import '@testing-library/jest-dom';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideosTable } from './VideosTable';
import { ProcessedVideo } from '../../../types/video';
import * as videosService from '../../../services/videos';

describe('VideosTable', () => {
  const videos: ProcessedVideo[] = [
    {
      id: 1,
      name: 'Alpha',
      author: 'Author A',
      categories: ['Thriller', 'Crime'],
      highestQualityFormat: 'one 1080p',
      releaseDate: '2020-01-01',
    },
    {
      id: 2,
      name: 'Bravo',
      author: 'Author B',
      categories: ['Comedy'],
      highestQualityFormat: 'two 720p',
      releaseDate: '2021-02-02',
    },
  ];

  afterEach(() => jest.restoreAllMocks());

  it('renders headers and rows', () => {
    render(<VideosTable videos={videos} />);

    // headers
    expect(screen.getByText('Video Name')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Highest Quality Format')).toBeInTheDocument();
    expect(screen.getByText('Release Date')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();

    // rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(3); // header + 2 data rows
    expect(rows[1]).toHaveTextContent('Alpha');
    expect(rows[2]).toHaveTextContent('Bravo');
  });

  it('calls onEdit when Edit button clicked for a row', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();

    render(<VideosTable videos={videos} onEdit={onEdit} />);

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const editBtn = within(firstDataRow).getByText('Edit');

    await user.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(videos[0]);
  });

  it('confirms delete via PopConfirm and calls deleteVideo and onDelete', async () => {
    const onDelete = jest.fn();
    const deleteMock = jest.spyOn(videosService, 'deleteVideo').mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<VideosTable videos={videos} onDelete={onDelete} />);

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const deleteBtn = within(firstDataRow).getByText('Delete');

    // trigger popconfirm
    await user.click(deleteBtn);

    // confirm dialog should appear
    expect(await screen.findByText('Delete video')).toBeInTheDocument();

    // click Yes to confirm
    await user.click(screen.getByText('Yes'));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(videos[0].id));
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
  });
});
