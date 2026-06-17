import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '@/store';
import { Card, Input, Badge, Modal } from '@/components/UI';
import type { Photo } from '@/types';
import styles from './GalleryPage.module.scss';

export const GalleryPage = observer(() => {
  const { filteredPhotos, getAlbumById, incrementViews, incrementDownloads, setFilter, filters } = dataStore;
  const { canDownloadPhotos } = authStore;
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    if (canDownloadPhotos()) return;

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's' || e.key === 'P' || e.key === 'p'))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canDownloadPhotos, selectedPhoto]);

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    incrementViews(photo.id);
  };

  const handleDownload = (photo: Photo) => {
    if (canDownloadPhotos()) {
      incrementDownloads(photo.id);
      // Если у фотографа есть права, скачиваем чистый оригинал, сохраненный в поле copyright.
      // Если фото старое и оригинала там нет (загружалось до настройки), скачается обычный imageUrl.
      const downloadUrl = (photo.watermark && photo.copyright && photo.copyright.startsWith('data:image')) 
        ? photo.copyright 
        : photo.imageUrl;
        
      window.open(downloadUrl, '_blank');
    }
  };

  const preventActions = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDownloadPhotos()) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.page}>
      {!canDownloadPhotos() && (
        <style>{`
          @media print { body { display: none !important; } }
          .no-screenshot { user-select: none !important; -webkit-user-select: none !important; }
        `}</style>
      )}

      <div className={styles.header}>
        <div><h1 className={styles.title}>Галерея</h1><p className={styles.subtitle}>Коллекция фотографий</p></div>
      </div>

      <Card className={styles.filters}>
        <Input placeholder="Поиск фотографий..." value={filters.search || ''} onChange={e => setFilter('search', e.target.value || undefined)} />
      </Card>

      {selectedPhoto ? (
        <Modal isOpen={!!selectedPhoto} onClose={() => { setSelectedPhoto(null); setIsBlurred(false); }} title={selectedPhoto.title} size="lg">
          <div className={styles.photoViewer}>
            
            <div 
              onContextMenu={preventActions}
              onDragStart={preventActions}
              className="no-screenshot"
              style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', background: '#141414' }}
            >
              {/* Все пользователи и фотографы видят фото с вшитой вотермаркой на экране */}
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
              {/* Показываем копирайт текстом, только если это обычная строка автора, а не скрытый оригинал */}
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
          {filteredPhotos.map(photo => (
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
