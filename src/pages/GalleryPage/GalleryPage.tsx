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
      {!canDownloadPhotos() && (
        <style>{`
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
        <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title={selectedPhoto.title} size="lg">
          <div className={styles.photoViewer}>
            
            {/* БЛОК МГНОВЕННОЙ ЗАЩИТЫ И НАЛОЖЕНИЯ ЗНАКА ДЛЯ ХОСТИНГА */}
            <div 
              onContextMenu={preventActions}
              onDragStart={preventActions}
              className="no-screenshot"
              style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}
            >
              {/* Оригинальное изображение грузится без сбоев */}
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

              {/* Если посетитель — гость: принудительно включаем защиту и вотермарку */}
              {!canDownloadPhotos() && (
                <>
                  {/* Прозрачный невидимый слой поверх фото */}
                  <div
                    onContextMenu={preventActions}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") repeat',
                      zIndex: 2,
                    }}
                  />

                  {/* Крупный водяной знак, который выводится прямо на экране */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'rgba(255, 255, 255, 0.4)', // Белый цвет с прозрачностью
                    fontSize: 'clamp(24px, 6vw, 54px)', // Адаптивный крупный размер
                    fontWeight: 'bold',
                    fontFamily: 'sans-serif',
                    letterSpacing: '3px',
                    pointerEvents: 'none',
                    zIndex: 3,
                    textShadow: '0px 0px 5px rgba(0,0,0,0.4)', // Тень, чтобы читалось на белом фоне
                    whiteSpace: 'nowrap'
                  }}>
                    ФОТОГАЛЕРЕЯ
                  </div>
                </>
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
