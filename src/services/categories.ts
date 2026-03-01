import { Category } from '../types/category';

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${process.env.REACT_APP_API}/categories`);

  return response.json() as unknown as Category[];
};
