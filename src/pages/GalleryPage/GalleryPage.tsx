import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Input, Badge, Modal } from '@/components/UI';
import styles from './GalleryPage.module.scss';

export const GalleryPage = observer(() => {
  const { filteredPhotos, getAlbumById, incrementViews, incrementDownloads, setFilter, filters } = dataStore as any;
  const { canDownloadPhotos } = authStore as any;
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const handlePhotoClick = (photo: any) => {
    setSelectedPhoto(photo);
    incrementViews(photo.id);
  };

  const handleDownload = (photo: any) => {
    if (canDownloadPhotos()) {
      incrementDownloads(photo.id);
      
      // Если в поле copyright сохранен чистый оригинал — скачиваем его
      const downloadUrl = (photo.watermark && photo.copyright && photo.copyright.startsWith('data:image')) 
        ? photo.copyright 
        : photo.imageUrl;
        
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = photo.title || 'photo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const preventActions = (e: any) => {
    if (!canDownloadPhotos()) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.page}>
      {!canDownloadPhotos() && (
        <style>{`
          .no-screenshot { user-select: none !important; -webkit-user-select: none !important; }
        `}</style>
      )}

      <div className={styles.header}>
        <div><h1 className={styles.title}>Галерея</h1><p className={styles.subtitle}>Коллекция фотографий</p></div>
      </div>

      <Card className={styles.filters}>
        <Input placeholder="Поиск фотографий..." value={filters.search || ''} onChange={(e: any) => setFilter('search', e.target.value || undefined)} />
      </Card>

      {selectedPhoto ? (
        <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title={selectedPhoto.title} size="lg">
          <div className={styles.photoViewer}>
            
            <div 
              onContextMenu={preventActions}
              onDragStart={preventActions}
              className="no-screenshot"
              style={{ position: 'relative', display: 'inline-block' }}
            >
              {/* Картинка (вотермарка теперь будет внутри самого файла) */}
              <img 
                src={selectedPhoto.imageUrl} 
                alt={selectedPhoto.title} 
                className={styles.photoImage} 
                onContextMenu={preventActions}
                onDragStart={preventActions}
                style={{
                  pointerEvents: canDownloadPhotos() ? 'auto' : 'none',
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />

              {/* Невидимый прозрачный слой поверх фото для гостей */}
              {!canDownloadPhotos() && (
                <div
                  onContextMenu={preventActions}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") repeat',
                    zIndex: 2,
                  }}
                />
              )}
            </div>

            {selectedPhoto.description && <p className={styles.photoDescription}>{selectedPhoto.description}</p>}
            <div className={styles.photoMeta}>
              <span>👁 {selectedPhoto.views}</span>
              <span>⬇ {selectedPhoto.downloads}</span>
              {/* Скрываем огромный код оригинала от гостей */}
              {selectedPhoto.copyright && !selectedPhoto.copyright.startsWith('data:image') && (
                <span>© {selectedPhoto.copyright}</span>
              )}
            </div>
            {canDownloadPhotos() && (
              <button className={styles.downloadButton} onClick={() => handleDownload(selectedPhoto)}>
                Скачать оригинал без вотермарки
              </button>
            )}
          </div>
        </Modal>
      ) : (
        <div className={styles.photosGrid}>
          {filteredPhotos.map((photo: any) => (
            <Card key={photo.id} className={styles.photoCard} hoverable onClick={() => handlePhotoClick(photo)}>
              <div 
                className={`${styles.photoThumbnail} no-screenshot`}
                style={{ 
                  backgroundImage: `url(${photo.thumbnailUrl || photo.imageUrl})`,
                  pointerEvents: canDownloadPhotos() ? 'auto' : 'none'
                }}
                onContextMenu={preventActions}
              >
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

