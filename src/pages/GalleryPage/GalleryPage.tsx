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

  // Жесткая блокировка горячих клавиш сохранения и DevTools
  useEffect(() => {
    if (canDownloadPhotos()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's' || e.key === 'P' || e.key === 'p'))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canDownloadPhotos]);

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

  const preventActions = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDownloadPhotos()) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.page}>
      {/* Встраиваем CSS-стили, которые работают быстрее JS при попытке напечатать или сохранить страницу */}
      {!canDownloadPhotos() && (
        <style>{`
          @media print {
            body { display: none !important; }
          }
          .no-screenshot {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
          }
        `}</style>
      )}

      <div className={styles.header}>
        <div><h1 className={styles.title}>Галерея</h1><p className={styles.subtitle}>Коллекция фотографий</p></div>
      </div>

      <Card className={styles.filters}>
        <Input placeholder="Поиск фотографий..." value={filters.search || ''} onChange={e => setFilter('search', e.target.value || undefined)} />
      </Card>

      {selectedPhoto ? (
        <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title={selectedPhoto.title} size="lg">
          <div className={styles.photoViewer}>
            
            {/* БЛОК МАКСИМАЛЬНОЙ ЗАЩИТЫ ИЗОБРАЖЕНИЯ */}
            <div 
              onContextMenu={preventActions}
              onDragStart={preventActions}
              className="no-screenshot"
              style={{ 
                position: 'relative', 
                display: 'inline-block',
                WebkitTouchCallout: canDownloadPhotos() ? 'default' : 'none',
                overflow: 'hidden',
                background: '#141414' // Фоновый цвет под картинкой
              }}
            >
              {/* Реальное изображение */}
              <img 
                src={selectedPhoto.imageUrl} 
                alt={selectedPhoto.title} 
                className={styles.photoImage} 
                onContextMenu={preventActions}
                onDragStart={preventActions}
                style={{
                  WebkitTouchCallout: canDownloadPhotos() ? 'default' : 'none',
                  pointerEvents: canDownloadPhotos() ? 'auto' : 'none', // Мышь полностью кликает сквозь картинку
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />

              {/* Прозрачный невидимый слой-капкан поверх всей картинки */}
              {!canDownloadPhotos() && (
                <div
                  onContextMenu={preventActions}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    // Тяжелый прозрачный GIF не позволяет перетащить или вызвать меню для img под ним
                    background: 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") repeat',
                    zIndex: 2,
                  }}
                />
              )}
            </div>
            {/* КОНЕЦ БЛОКА ЗАЩИТЫ */}

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

