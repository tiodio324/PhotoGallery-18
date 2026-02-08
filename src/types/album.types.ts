export interface Album { id: string; name: string; description?: string; coverPhotoId?: string; isPublic: boolean; isActive: boolean; createdAt: string; updatedAt: string; }
export interface AlbumFormData { name: string; description?: string; coverPhotoId?: string; isPublic: boolean; }
