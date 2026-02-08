import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Input, Badge, Modal } from '@/components/UI';
import type { Photo } from '@/types';
import styles from './GalleryPage.module.scss';

export const GalleryPage = observer(() => {
  const { filteredPhotos, getAlbumById, incrementViews, incrementDownloads, setFilter, filters } = dataStore;
  const { canDownloadPhotos } = authStore;
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    incrementViews(photo.id);
  };

  const handleDownload = (photo: Photo) => {
    if (canDownloadPhotos()) {
      incrementDownloads(photo.id);
      window.open(photo.imageUrl, '_blank');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Галерея</h1><p className={styles.subtitle}>Коллекция фотографий</p></div>
      </div>

      <Card className={styles.filters}>
        <Input placeholder="Поиск фотографий..." value={filters.search || ''} onChange={e => setFilter('search', e.target.value || undefined)} />
      </Card>

      {selectedPhoto ? (
        <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title={selectedPhoto.title} size="lg">
          <div className={styles.photoViewer}>
            <img src={selectedPhoto.imageUrl} alt={selectedPhoto.title} className={styles.photoImage} />
            {selectedPhoto.description && <p className={styles.photoDescription}>{selectedPhoto.description}</p>}
            <div className={styles.photoMeta}>
              <span>👁 {selectedPhoto.views}</span>
              <span>⬇ {selectedPhoto.downloads}</span>
              {selectedPhoto.copyright && <span>© {selectedPhoto.copyright}</span>}
            </div>
            {canDownloadPhotos() && (
              <button className={styles.downloadButton} onClick={() => handleDownload(selectedPhoto)}>
                Скачать фотографию
              </button>
            )}
          </div>
        </Modal>
      ) : (
        <div className={styles.photosGrid}>
          {filteredPhotos.map(photo => (
            <Card key={photo.id} className={styles.photoCard} hoverable onClick={() => handlePhotoClick(photo)}>
              <div className={styles.photoThumbnail} style={{ backgroundImage: `url(${photo.thumbnailUrl || photo.imageUrl})` }}>
                {photo.watermark && <div className={styles.watermark}>©</div>}
              </div>
              <div className={styles.photoInfo}>
                <h3 className={styles.photoTitle}>{photo.title}</h3>
                {getAlbumById(photo.albumId) && <Badge variant="info">{getAlbumById(photo.albumId)?.name}</Badge>}
                <div className={styles.photoStats}>
                  <span>👁 {photo.views}</span>
                  <span>⬇ {photo.downloads}</span>
                </div>
              </div>
            </Card>
          ))}
          {filteredPhotos.length === 0 && <p className={styles.empty}>Фотографии не найдены</p>}
        </div>
      )}
    </div>
  );
});
