import { Author } from '../types/author';

export const getAuthors = async (): Promise<Author[]> => {
  const response = await fetch(`${process.env.REACT_APP_API}/authors`);

  return response.json() as unknown as Author[];
};

export const getAuthorById = async (id: number): Promise<Author> => {
  const response = await fetch(`${process.env.REACT_APP_API}/authors/${id}`);

  return response.json() as unknown as Author;
};

export const updateVideosForAuthor = async (authorId: number, videos: Author['videos']): Promise<void> => {
  await fetch(`${process.env.REACT_APP_API}/authors/${authorId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videos,
    }),
  });
};
