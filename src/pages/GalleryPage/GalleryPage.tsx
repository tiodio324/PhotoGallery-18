import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore } from '../../store'; // Исправили путь @/store
import { Card, Input, Badge, Modal } from '../../components/UI'; // Исправили путь @/components/UI
import styles from './GalleryPage.module.scss';
const { isPhotographer } = authStore;
export const GalleryPage = observer(() => {
  const { filteredPhotos, getAlbumById, incrementViews, filters, setFilter } = dataStore as any;
  const { canDownloadPhotos } = authStore as any;
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const handlePhotoClick = (photo: any) => {
    setSelectedPhoto(photo);
    incrementViews(photo.id);
  };

  const preventActions = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canDownloadPhotos()) {
      e.preventDefault();
    }
  };

  // ЧИСТАЯ ФИЛЬТРАЦИЯ: скрываем от гостей карточки из личных альбомов
  const displayedPhotos = filteredPhotos.filter((photo: any) => {
    if (canDownloadPhotos()) return true; // Фотограф видит абсолютно всё
    
    const album = getAlbumById(photo.albumId);
    if (!album) return true;

    const albumNameLower = album.name ? album.name.toLowerCase() : '';
    const isPrivateAlbum = 
      albumNameLower === 'личное' || 
      albumNameLower === 'private' ||
      album.isPrivate === true || 
      album.isPublic === false;

    return !isPrivateAlbum; // Гости видят только публичные альбомы
  });

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
            
            {/* БЛОК МГНОВЕННОЙ ЗАЩИТЫ И НАЛОЖЕНИЯ ЗНАКА */}
            <div 
              onContextMenu={preventActions}
              onDragStart={preventActions}
              className="no-screenshot"
              style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}
            >
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
                <>
                  <div
                    onContextMenu={preventActions}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      background: 'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") repeat',
                      zIndex: 2,
                    }}
                  />

                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'rgba(255, 255, 255, 0.4)', 
                    fontSize: 'clamp(24px, 6vw, 54px)', 
                    fontWeight: 'bold',
                    fontFamily: 'sans-serif',
                    letterSpacing: '3px',
                    pointerEvents: 'none',
                    zIndex: 3,
                    textShadow: '0px 0px 5px rgba(0,0,0,0.4)', 
                    whiteSpace: 'nowrap'
                  }}>
                    ФОТОГАЛЕРЕЯ
                  </div>
                </>
              )}
            </div>

            {selectedPhoto.description && <p className={styles.photoDescription}>{selectedPhoto.description}</p>}
            <div className={styles.photoMeta}>
              <span>👁 {selectedPhoto.views}</span>
              {authStore.isAuthenticated && authStore.isPhotographer && (
            <a
              href={selectedPhoto.originalUrl || selectedPhoto.imageUrl}
              download={`photo-${selectedPhoto.id}.jpg`}
              className={styles.downloadButton}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ width: '16px', height: '16px', flexShrink: 0 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Скачать оригинал
            </a>
          )}
    
              {selectedPhoto.copyright && !String(selectedPhoto.copyright).startsWith('data:image') && (
                <span>© {selectedPhoto.copyright}</span>
              )}
            </div>
          </div>
        </Modal>
      ) : (
        <div className={styles.photosGrid}>
          {displayedPhotos.map((photo: any) => (
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
                  
                  {photo.copyright && !String(photo.copyright).startsWith('data:image') && (
                    <span>© {photo.copyright}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {displayedPhotos.length === 0 && <p className={styles.empty}>Фотографии не найдены</p>}
        </div>
      )}
    </div>
  );
});
