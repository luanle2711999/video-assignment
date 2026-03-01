import { getAuthors, getAuthorById, updateVideosForAuthor } from './authors';

describe('authors service', () => {
  const API = 'http://localhost:3001';

  beforeAll(() => {
    process.env.REACT_APP_API = API;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete (global as any).fetch;
  });

  it('getAuthors calls fetch and returns parsed JSON', async () => {
    const mock = [{ id: 1, name: 'Author A', videos: [] }];
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => mock });

    const res = await getAuthors();

    expect((global as any).fetch).toHaveBeenCalledWith(`${API}/authors`);
    expect(res).toEqual(mock);
  });

  it('getAuthorById calls fetch with id and returns parsed JSON', async () => {
    const mock = { id: 2, name: 'Author B', videos: [] };
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => mock });

    const res = await getAuthorById(2);

    expect((global as any).fetch).toHaveBeenCalledWith(`${API}/authors/2`);
    expect(res).toEqual(mock);
  });

  it('updateVideosForAuthor sends PATCH with videos in body', async () => {
    const videos = [{ id: 1, name: 'V1' } as any];
    (global as any).fetch = jest.fn().mockResolvedValue({});

    await updateVideosForAuthor(5, videos as any);

    expect((global as any).fetch).toHaveBeenCalledWith(
      `${API}/authors/5`,
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos }),
      })
    );
  });
});
