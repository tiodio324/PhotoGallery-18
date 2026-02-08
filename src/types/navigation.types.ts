export type PageId = 'home' | 'gallery' | 'albums' | 'admin' | 'admin-photos' | 'admin-albums';
export interface PageConfig { id: PageId; title: string; icon: string; requiresAuth: boolean; requiredRole?: 'photographer' | 'admin'; showInNav: boolean; parentId?: PageId; }
export const PAGES_CONFIG: Record<PageId, PageConfig> = {
  home: { id: 'home', title: 'Главная', icon: 'home', requiresAuth: false, showInNav: true },
  gallery: { id: 'gallery', title: 'Галерея', icon: 'image', requiresAuth: false, showInNav: true },
  albums: { id: 'albums', title: 'Альбомы', icon: 'folder', requiresAuth: false, showInNav: true },
  admin: { id: 'admin', title: 'Управление', icon: 'settings', requiresAuth: true, requiredRole: 'photographer', showInNav: true },
  'admin-photos': { id: 'admin-photos', title: 'Фотографии', icon: 'image', requiresAuth: true, requiredRole: 'photographer', showInNav: false, parentId: 'admin' },
  'admin-albums': { id: 'admin-albums', title: 'Альбомы', icon: 'folder', requiresAuth: true, requiredRole: 'photographer', showInNav: false, parentId: 'admin' },
};
