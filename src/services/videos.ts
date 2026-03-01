import { getCategories } from './categories';
import { getAuthors, getAuthorById, updateVideosForAuthor } from './authors';
import { ProcessedVideo, Video } from '../types/video';

/**
 * Determines the highest quality format from a formats object.
 * Priority: biggest size first, then highest resolution as tiebreaker.
 * Label format: "format_name res" (e.g., "two 720p")
 */
const getHighestQualityFormat = (formats: { [key: string]: { res: string; size: number } }): string => {
  const formatEntries = Object.entries(formats);

  if (formatEntries.length === 0) return '';

  const [bestName, bestFormat] = formatEntries.reduce((best, current) => {
    const [, bestFmt] = best;
    const [, currentFmt] = current;

    if (currentFmt.size > bestFmt.size) return current;
    if (currentFmt.size === bestFmt.size && parseInt(currentFmt.res) > parseInt(bestFmt.res)) return current;
    return best;
  });

  return `${bestName} ${bestFormat.res}`;
};

export const getVideos = async (): Promise<ProcessedVideo[]> => {
  const [categories, authors] = await Promise.all([getCategories(), getAuthors()]);

  const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

  const processedVideos: ProcessedVideo[] = authors.flatMap((author) =>
    author.videos.map((video) => ({
      id: video.id,
      name: video.name,
      author: author.name,
      categories: video.catIds.map((catId) => categoryMap.get(catId)).filter((name): name is string => Boolean(name)),
      highestQualityFormat: getHighestQualityFormat(video.formats),
      releaseDate: video.releaseDate,
    }))
  );

  return processedVideos;
};

export const addVideo = async (authorId: number, video: { name: string; catIds: number[] }): Promise<void> => {
  // Fetch the author to get their current videos
  const author = await getAuthorById(authorId);

  // Generate a new video id (max existing id + 1 across all videos)
  const allAuthors = await getAuthors();
  const allVideoIds = allAuthors.flatMap((a) => a.videos.map((v) => v.id));
  const newId = allVideoIds.length > 0 ? Math.max(...allVideoIds) + 1 : 1;

  const newVideo: Video = {
    id: newId,
    catIds: video.catIds,
    name: video.name,
    formats: {
      one: { res: '1080p', size: 1000 },
    },
    releaseDate: new Date().toISOString().split('T')[0],
  };

  const updatedVideos = [...author.videos, newVideo];

  // PATCH the author with the updated videos array
  await updateVideosForAuthor(authorId, updatedVideos);
};

export const editVideo = async (videoId: number, authorId: number, video: { name: string; catIds: number[] }): Promise<void> => {
  const allAuthors = await getAuthors();

  // Find the current author who owns this video
  const currentAuthor = allAuthors.find((a) => a.videos.some((v) => v.id === videoId));
  if (!currentAuthor) throw new Error(`Video with id ${videoId} not found`);

  const existingVideo = currentAuthor.videos.find((v) => v.id === videoId)!;

  if (currentAuthor.id === authorId) {
    // Same author — just update the video in place
    const updatedVideos = currentAuthor.videos.map((v) => (v.id === videoId ? { ...v, name: video.name, catIds: video.catIds } : v));
    await updateVideosForAuthor(authorId, updatedVideos);
  } else {
    // Different author — remove from old, add to new
    const removedVideos = currentAuthor.videos.filter((v) => v.id !== videoId);
    await updateVideosForAuthor(currentAuthor.id, removedVideos);

    const newAuthor = await getAuthorById(authorId);
    const movedVideo: Video = { ...existingVideo, name: video.name, catIds: video.catIds };
    await updateVideosForAuthor(authorId, [...newAuthor.videos, movedVideo]);
  }
};

export const deleteVideo = async (videoId: number): Promise<void> => {
  const allAuthors = await getAuthors();

  const author = allAuthors.find((a) => a.videos.some((v) => v.id === videoId));
  if (!author) throw new Error(`Video with id ${videoId} not found`);

  const updatedVideos = author.videos.filter((v) => v.id !== videoId);
  await updateVideosForAuthor(author.id, updatedVideos);
};
