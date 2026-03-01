import { getCategories } from './categories';

describe('categories service', () => {
  const API = 'http://localhost:3001';

  beforeAll(() => {
    process.env.REACT_APP_API = API;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete (global as any).fetch;
  });

  it('getCategories calls fetch and returns parsed JSON', async () => {
    const mock = [
      { value: 1, label: 'Thriller' },
      { value: 2, label: 'Crime' },
    ];

    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => mock });

    const res = await getCategories();

    expect((global as any).fetch).toHaveBeenCalledWith(`${API}/categories`);
    expect(res).toEqual(mock);
  });

  it('returns an empty array when API responds with empty list', async () => {
    const mock: any[] = [];
    (global as any).fetch = jest.fn().mockResolvedValue({ json: async () => mock });

    const res = await getCategories();

    expect((global as any).fetch).toHaveBeenCalledWith(`${API}/categories`);
    expect(res).toEqual([]);
  });
});
