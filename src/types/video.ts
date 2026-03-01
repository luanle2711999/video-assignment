export interface Video {
  id: number;
  catIds: number[];
  name: string;
  formats: { [key: string]: { res: string; size: number } };
  releaseDate: string;
}

export interface ProcessedVideo {
  id: number;
  name: string;
  author: string;
  categories: string[];
  highestQualityFormat: string;
  releaseDate: string;
}
