import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { VideosTable } from './VideosTable';
import { getVideos } from '../../services/videos';
import { Input } from '../../components/Input';
import { SearchIcon } from '../../assets/icons';
import { Button } from '../../components/Button';
import { useDebounce } from '../../hooks/useDebounce';
import { ModalAddVideo } from './ModalAddVideo/ModalAddAndUpdateVideo';
import styles from './HomePage.module.css';
import { ProcessedVideo } from '../../types/video';

const HomePage = () => {
  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ProcessedVideo | null>(null);

  const fetchVideos = () => {
    getVideos().then(setVideos);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleEdit = (video: ProcessedVideo) => {
    setEditingVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  const filteredVideos = videos.filter((video) => video.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
  return (
    <MainLayout>
      <h1>VManager Demo v0.0.1</h1>
      <div className={styles.featureWrapper}>
        <div className={styles.searchWrapper}>
          <Input
            placeholder="Search videos..."
            allowClear
            suffix={<SearchIcon width={16} height={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Add video
        </Button>
      </div>
      <ModalAddVideo open={isModalOpen} onCancel={handleCloseModal} onSuccess={fetchVideos} video={editingVideo} />
      <VideosTable videos={filteredVideos} onEdit={handleEdit} onDelete={fetchVideos} />
    </MainLayout>
  );
};

export default HomePage;
