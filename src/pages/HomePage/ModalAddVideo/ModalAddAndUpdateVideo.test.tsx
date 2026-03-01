import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as videosService from '../../../services/videos';
import { AUTHORS } from '../../../constants/authors';
import { CATEGORIES } from '../../../constants/categories';
import { ModalAddVideo } from './ModalAddAndUpdateVideo';

describe('ModalAddVideo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('submits add flow and calls addVideo/onSuccess/onCancel', async () => {
    const user = userEvent.setup();
    const addMock = jest.spyOn(videosService, 'addVideo').mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const onCancel = jest.fn();

    render(<ModalAddVideo open onCancel={onCancel} onSuccess={onSuccess} />);

    // fill video name
    const nameInput = screen.getByPlaceholderText('Enter video name') as HTMLInputElement;
    await user.type(nameInput, 'New Movie');

    // select author (first select)
    const roots = screen.getAllByTestId('select-root');
    await user.click(roots[0]);
    // choose first author value
    await user.click(screen.getByTestId(`select-option-${AUTHORS[0].value}`));

    // select categories (second select, multiple)
    await user.click(roots[1]);
    await user.click(screen.getByTestId(`select-option-${CATEGORIES[0].value}`));
    await user.click(screen.getByTestId(`select-option-${CATEGORIES[1].value}`));

    // submit
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(addMock).toHaveBeenCalled());

    // verify called with expected args
    expect(addMock).toHaveBeenCalledWith(AUTHORS[0].value, {
      name: 'New Movie',
      catIds: [CATEGORIES[0].value, CATEGORIES[1].value],
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('submits edit flow and calls editVideo/onSuccess/onCancel', async () => {
    const user = userEvent.setup();
    const editMock = jest.spyOn(videosService, 'editVideo').mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const onCancel = jest.fn();

    const video = {
      id: 42,
      name: 'Existing',
      author: AUTHORS[0].label,
      categories: [CATEGORIES[0].label, CATEGORIES[1].label],
      highestQualityFormat: 'one 1080p',
      releaseDate: '2020-01-01',
    } as any;

    render(<ModalAddVideo open onCancel={onCancel} onSuccess={onSuccess} video={video} />);

    // since initialValues are set, the form should submit without editing
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(editMock).toHaveBeenCalled());

    expect(editMock).toHaveBeenCalledWith(video.id, AUTHORS[0].value, {
      name: video.name,
      catIds: [CATEGORIES[0].value, CATEGORIES[1].value],
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<ModalAddVideo open onCancel={() => {}} />);

    // submit without filling
    await user.click(screen.getByRole('button', { name: 'Add' }));

    // expect validation messages to appear
    expect(await screen.findByText('Please enter video name')).toBeInTheDocument();
    expect(screen.getByText('Please select author name')).toBeInTheDocument();
    expect(screen.getByText('Please select a category')).toBeInTheDocument();
  });
});
