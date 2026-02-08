export type UserRole = 'viewer' | 'photographer' | 'admin';
export interface User { role: UserRole; }
export interface RolePermissions { canViewPhotos: boolean; canDownloadPhotos: boolean; canManagePhotos: boolean; canManageAlbums: boolean; canManageWatermarks: boolean; canAccessAdmin: boolean; }
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  viewer: { canViewPhotos: true, canDownloadPhotos: false, canManagePhotos: false, canManageAlbums: false, canManageWatermarks: false, canAccessAdmin: false },
  photographer: { canViewPhotos: true, canDownloadPhotos: true, canManagePhotos: true, canManageAlbums: false, canManageWatermarks: true, canAccessAdmin: false },
  admin: { canViewPhotos: true, canDownloadPhotos: true, canManagePhotos: true, canManageAlbums: true, canManageWatermarks: true, canAccessAdmin: true },
};
