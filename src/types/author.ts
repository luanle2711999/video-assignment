import { Video } from './video';

export interface Author {
  id: number;
  name: string;
  videos: Video[];
}
