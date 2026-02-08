import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore } from '@/store';
import { Card, Badge } from '@/components/UI';
import styles from './AlbumsPage.module.scss';

export const AlbumsPage = observer(() => {
  const { publicAlbums, getPhotosForAlbum, getCoverPhoto, setFilter } = dataStore;
  const { navigate } = navigationStore;

  const handleAlbumClick = (albumId: string) => {
    setFilter('albumId', albumId);
    navigate('gallery');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Альбомы</h1><p className={styles.subtitle}>Организованные коллекции фотографий</p></div>
      </div>

      <div className={styles.albumsGrid}>
        {publicAlbums.map(album => {
          const coverPhoto = getCoverPhoto(album);
          const photosCount = getPhotosForAlbum(album.id).length;
          return (
            <Card key={album.id} className={styles.albumCard} hoverable onClick={() => handleAlbumClick(album.id)}>
              <div className={styles.albumCover} style={{ backgroundImage: coverPhoto ? `url(${coverPhoto.thumbnailUrl || coverPhoto.imageUrl})` : 'none' }}>
                {!coverPhoto && <div className={styles.placeholder}>📷</div>}
              </div>
              <div className={styles.albumInfo}>
                <h3 className={styles.albumName}>{album.name}</h3>
                {album.description && <p className={styles.albumDesc}>{album.description}</p>}
                <Badge variant="info">{photosCount} фото</Badge>
              </div>
            </Card>
          );
        })}
        {publicAlbums.length === 0 && <p className={styles.empty}>Альбомы не найдены</p>}
      </div>
    </div>
  );
});
