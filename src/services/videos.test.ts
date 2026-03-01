import { getVideos, addVideo, editVideo, deleteVideo } from './videos';
import * as authorsService from './authors';
import * as categoriesService from './categories';

describe('videos service', () => {
  afterEach(() => jest.restoreAllMocks());

  it('getVideos maps authors/categories and determines highestQualityFormat', async () => {
    const categories = [
      { id: 1, name: 'Thriller' },
      { id: 2, name: 'Crime' },
    ];

    const authors = [
      {
        id: 10,
        name: 'Alice',
        videos: [
          {
            id: 100,
            name: 'Set the Moon',
            catIds: [1, 2],
            formats: {
              one: { res: '1080p', size: 1000 },
              two: { res: '720p', size: 2000 },
            },
            releaseDate: '2018-08-09',
          },
        ],
      },
    ];

    jest.spyOn(categoriesService, 'getCategories').mockResolvedValue(categories as any);
    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue(authors as any);

    const result = await getVideos();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 100,
      name: 'Set the Moon',
      author: 'Alice',
      categories: ['Thriller', 'Crime'],
      highestQualityFormat: 'two 720p', // size 2000 is larger than 1000
      releaseDate: '2018-08-09',
    });
  });

  it('addVideo generates new id and calls updateVideosForAuthor', async () => {
    const authorId = 1;
    const author = { id: authorId, name: 'A', videos: [{ id: 1, name: 'v1', catIds: [1], formats: {}, releaseDate: '2020-01-01' }] } as any;

    const allAuthors = [
      author,
      { id: 2, name: 'B', videos: [{ id: 5, name: 'v5', catIds: [2], formats: {}, releaseDate: '2020-01-02' }] },
    ] as any;

    jest.spyOn(authorsService, 'getAuthorById').mockResolvedValue(author as any);
    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue(allAuthors as any);
    const updateSpy = jest.spyOn(authorsService, 'updateVideosForAuthor').mockResolvedValue(undefined as any);

    await addVideo(authorId, { name: 'New Movie', catIds: [1, 2] });

    // new id should be max existing id (5) + 1 = 6
    expect(updateSpy).toHaveBeenCalledWith(
      authorId,
      expect.arrayContaining([expect.objectContaining({ id: 6, name: 'New Movie', catIds: [1, 2] })])
    );
  });

  it('editVideo updates video in place when same author', async () => {
    const videoId = 10;
    const authorId = 1;

    const authors = [
      { id: authorId, name: 'A', videos: [{ id: videoId, name: 'Old', catIds: [1], formats: {}, releaseDate: '2020-01-01' }] },
      { id: 2, name: 'B', videos: [] },
    ] as any;

    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue(authors as any);
    const updateSpy = jest.spyOn(authorsService, 'updateVideosForAuthor').mockResolvedValue(undefined as any);

    await editVideo(videoId, authorId, { name: 'Updated', catIds: [2, 3] });

    expect(updateSpy).toHaveBeenCalledWith(
      authorId,
      expect.arrayContaining([expect.objectContaining({ id: videoId, name: 'Updated', catIds: [2, 3] })])
    );
  });

  it('editVideo moves video between authors when authorId differs', async () => {
    const videoId = 20;
    const currentAuthor = {
      id: 1,
      name: 'A',
      videos: [{ id: videoId, name: 'Old', catIds: [1], formats: {}, releaseDate: '2020-01-01' }],
    } as any;
    const newAuthor = { id: 2, name: 'B', videos: [{ id: 99, name: 'Other', catIds: [2], formats: {}, releaseDate: '2020-02-02' }] } as any;

    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue([currentAuthor, newAuthor] as any);
    const updateSpy = jest.spyOn(authorsService, 'updateVideosForAuthor').mockResolvedValue(undefined as any);
    jest.spyOn(authorsService, 'getAuthorById').mockResolvedValue(newAuthor as any);

    await editVideo(videoId, newAuthor.id, { name: 'Moved', catIds: [3] });

    // first call should remove from current author
    expect(updateSpy).toHaveBeenCalledWith(currentAuthor.id, expect.not.arrayContaining([expect.objectContaining({ id: videoId })]));
    // second call should add to new author
    expect(updateSpy).toHaveBeenCalledWith(
      newAuthor.id,
      expect.arrayContaining([expect.objectContaining({ id: videoId, name: 'Moved', catIds: [3] })])
    );
  });

  it('editVideo throws when video not found', async () => {
    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue([] as any);

    await expect(editVideo(999, 1, { name: 'X', catIds: [] })).rejects.toThrow('Video with id 999 not found');
  });

  it('deleteVideo removes video and calls updateVideosForAuthor', async () => {
    const videoId = 7;
    const author = {
      id: 3,
      name: 'C',
      videos: [
        { id: videoId, name: 'ToDelete', catIds: [], formats: {}, releaseDate: '2020-01-01' },
        { id: 8, name: 'Keep', catIds: [], formats: {}, releaseDate: '2020-01-02' },
      ],
    } as any;

    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue([author] as any);
    const updateSpy = jest.spyOn(authorsService, 'updateVideosForAuthor').mockResolvedValue(undefined as any);

    await deleteVideo(videoId);

    expect(updateSpy).toHaveBeenCalledWith(author.id, expect.arrayContaining([expect.objectContaining({ id: 8 })]));
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it('deleteVideo throws when video not found', async () => {
    jest.spyOn(authorsService, 'getAuthors').mockResolvedValue([] as any);

    await expect(deleteVideo(1234)).rejects.toThrow('Video with id 1234 not found');
  });
});
