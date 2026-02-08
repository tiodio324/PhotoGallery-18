import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { Photo, PhotoFormData, Album, AlbumFormData, FilterParams } from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';

export class DataStore {
  photos: Photo[] = []; albums: Album[] = [];
  photosLoading = false; albumsLoading = false;
  error: string | null = null; filters: FilterParams = {};

  constructor() { makeAutoObservable(this, {}, { autoBind: true }); }

  get activePhotos(): Photo[] { return this.photos.filter(p => p.isActive).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  get publicAlbums(): Album[] { return this.albums.filter(a => a.isActive && a.isPublic).sort((a, b) => a.name.localeCompare(b.name, 'ru')); }
  get activeAlbums(): Album[] { return this.albums.filter(a => a.isActive).sort((a, b) => a.name.localeCompare(b.name, 'ru')); }
  
  get filteredPhotos(): Photo[] {
    let r = this.activePhotos;
    if (this.filters.albumId) r = r.filter(p => p.albumId === this.filters.albumId);
    if (this.filters.search) { const s = this.filters.search.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s)); }
    if (this.filters.tags && this.filters.tags.length > 0) r = r.filter(p => this.filters.tags!.some(t => p.tags.includes(t)));
    return r;
  }

  get totalViews(): number { return this.activePhotos.reduce((s, p) => s + p.views, 0); }
  get totalDownloads(): number { return this.activePhotos.reduce((s, p) => s + p.downloads, 0); }

  getAlbumById = (id: string): Album | undefined => this.albums.find(a => a.id === id);
  getPhotosForAlbum = (albumId: string): Photo[] => this.activePhotos.filter(p => p.albumId === albumId);
  getCoverPhoto = (album: Album): Photo | undefined => album.coverPhotoId ? this.photos.find(p => p.id === album.coverPhotoId) : this.getPhotosForAlbum(album.id)[0];

  loadAllData = async (): Promise<void> => { await Promise.all([this.loadPhotos(), this.loadAlbums()]); };

  loadPhotos = async (): Promise<void> => { this.photosLoading = true; try { const d = await FirebaseService.getData<Record<string, Photo>>('photos'); runInAction(() => { this.photos = d ? Object.values(d) : []; this.photosLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки фотографий'; this.photosLoading = false; }); } };
  loadAlbums = async (): Promise<void> => { this.albumsLoading = true; try { const d = await FirebaseService.getData<Record<string, Album>>('albums'); runInAction(() => { this.albums = d ? Object.values(d) : []; this.albumsLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки альбомов'; this.albumsLoading = false; }); } };

  createPhoto = async (data: PhotoFormData): Promise<Photo | null> => { if (!authStore.canManagePhotos()) return null; const now = new Date().toISOString(); const p: Photo = { id: uuidv4(), ...data, description: data.description || '', thumbnailUrl: data.thumbnailUrl || '', views: 0, downloads: 0, isActive: true, createdAt: now, updatedAt: now }; try { await FirebaseService.setData(`photos/${p.id}`, p); runInAction(() => { this.photos.push(p); }); return p; } catch { return null; } };
  updatePhoto = async (id: string, data: Partial<PhotoFormData>): Promise<boolean> => { if (!authStore.canManagePhotos()) return false; const i = this.photos.findIndex(p => p.id === id); if (i === -1) return false; const u = { ...this.photos[i], ...data, updatedAt: new Date().toISOString() }; try { await FirebaseService.setData(`photos/${id}`, u); runInAction(() => { this.photos[i] = u; }); return true; } catch { return false; } };
  deletePhoto = async (id: string): Promise<boolean> => { if (!authStore.canManagePhotos()) return false; const i = this.photos.findIndex(p => p.id === id); if (i === -1) return false; try { await FirebaseService.updateData(`photos/${id}`, { isActive: false }); runInAction(() => { this.photos[i].isActive = false; }); return true; } catch { return false; } };
  incrementViews = async (id: string): Promise<void> => { const i = this.photos.findIndex(p => p.id === id); if (i !== -1) { const newViews = this.photos[i].views + 1; await FirebaseService.updateData(`photos/${id}`, { views: newViews }); runInAction(() => { this.photos[i].views = newViews; }); } };
  incrementDownloads = async (id: string): Promise<void> => { if (!authStore.canDownloadPhotos()) return; const i = this.photos.findIndex(p => p.id === id); if (i !== -1) { const newDownloads = this.photos[i].downloads + 1; await FirebaseService.updateData(`photos/${id}`, { downloads: newDownloads }); runInAction(() => { this.photos[i].downloads = newDownloads; }); } };

  createAlbum = async (data: AlbumFormData): Promise<Album | null> => { if (!authStore.canManageAlbums()) return null; const now = new Date().toISOString(); const a: Album = { id: uuidv4(), ...data, description: data.description || '', coverPhotoId: data.coverPhotoId || '', isActive: true, createdAt: now, updatedAt: now }; try { await FirebaseService.setData(`albums/${a.id}`, a); runInAction(() => { this.albums.push(a); }); return a; } catch { return null; } };
  updateAlbum = async (id: string, data: Partial<AlbumFormData>): Promise<boolean> => { if (!authStore.canManageAlbums()) return false; const i = this.albums.findIndex(a => a.id === id); if (i === -1) return false; const u = { ...this.albums[i], ...data, updatedAt: new Date().toISOString() }; try { await FirebaseService.setData(`albums/${id}`, u); runInAction(() => { this.albums[i] = u; }); return true; } catch { return false; } };
  deleteAlbum = async (id: string): Promise<boolean> => { if (!authStore.canManageAlbums()) return false; const i = this.albums.findIndex(a => a.id === id); if (i === -1) return false; try { await FirebaseService.updateData(`albums/${id}`, { isActive: false }); runInAction(() => { this.albums[i].isActive = false; }); return true; } catch { return false; } };

  setFilter = (key: keyof FilterParams, value: string | string[] | undefined): void => { this.filters = { ...this.filters, [key]: value }; };
  clearFilters = (): void => { this.filters = {}; };
  clearError = (): void => { this.error = null; };
}

export const dataStore = new DataStore();
