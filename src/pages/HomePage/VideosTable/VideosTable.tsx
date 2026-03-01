import { Button } from '../../../components/Button';
import { PopConfirm } from '../../../components/PopConfirm';
import { Column, Table } from '../../../components/Table';
import { ProcessedVideo } from '../../../types/video';
import { deleteVideo } from '../../../services/videos';
import styles from './VideosTable.module.css';

type VideosTableProps = {
  videos: ProcessedVideo[];
  onEdit?: (video: ProcessedVideo) => void;
  onDelete?: () => void;
};

const renderFormat = (format: string) => {
  const [name, res] = format.split(' ');
  return (
    <span className={styles.format}>
      <span className={styles.formatName}>{name}</span>
      <span className={styles.formatRes}>{res}</span>
    </span>
  );
};

const getColumns = (onEdit?: (video: ProcessedVideo) => void, onDelete?: () => void): Column<ProcessedVideo>[] => [
  { key: 'name', title: 'Video Name', render: (video) => video.name, sortable: true, sortValue: (video) => video.name.toLowerCase() },
  { key: 'author', title: 'Author', render: (video) => video.author, sortable: true, sortValue: (video) => video.author.toLowerCase() },
  {
    key: 'categories',
    title: 'Categories',
    hiddenOnMobile: true,
    render: (video) => (
      <div className={styles.categories}>
        {video.categories.map((cat) => (
          <span key={cat} className={styles.badge}>
            {cat}
          </span>
        ))}
      </div>
    ),
  },
  {
    key: 'format',
    title: 'Highest Quality Format',
    hiddenOnMobile: true,
    render: (video) => renderFormat(video.highestQualityFormat),
  },
  {
    key: 'releaseDate',
    title: 'Release Date',
    render: (video) => video.releaseDate,
    sortable: true,
    sortValue: (video) => new Date(video.releaseDate).getTime(),
    hiddenOnMobile: true,
  },
  {
    key: 'options',
    title: 'Options',
    render: (video) => (
      <div className={styles.actions}>
        <Button variant="primary" size="sm" onClick={() => onEdit?.(video)}>
          Edit
        </Button>
        <PopConfirm
          title="Delete video"
          description="Are you sure you want to delete this video?"
          okText="Yes"
          cancelText="No"
          okType="danger"
          onConfirm={async () => {
            await deleteVideo(video.id);
            onDelete?.();
          }}>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </PopConfirm>
      </div>
    ),
  },
];

export const VideosTable = ({ videos, onEdit, onDelete }: VideosTableProps) => {
  return <Table columns={getColumns(onEdit, onDelete)} data={videos} rowKey={(video) => video.id} />;
};
