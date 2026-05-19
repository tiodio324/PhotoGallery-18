import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore, authStore } from '@/store';
import { Card, Button, Table, Modal, Input, Select } from '@/components/UI';
import { readFileAsDataUrl, MAX_PHOTO_FILE_BYTES } from '@/utils';
import type { TableColumn } from '@/components/UI';
import type { Photo, Album, PhotoFormData, AlbumFormData, SelectOption } from '@/types';
import styles from './AdminPage.module.scss';

type AdminTab = 'photos' | 'albums';

export const AdminPage = observer(() => {
  const { photos, albums, photosLoading, albumsLoading, getAlbumById, createPhoto, updatePhoto, deletePhoto, createAlbum, updateAlbum, deleteAlbum, activeAlbums } = dataStore;
  const { isAdmin } = authStore;
  const [activeTab, setActiveTab] = useState<AdminTab>('photos');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoForm, setPhotoForm] = useState<PhotoFormData>({ title: '', description: '', imageUrl: '', thumbnailUrl: '', albumId: '', tags: [], watermark: false, copyright: '' });
  const [albumForm, setAlbumForm] = useState<AlbumFormData>({ name: '', description: '', isPublic: true });
  const imageFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  const albumOptions: SelectOption[] = [
    { value: '', label: 'Без альбома' },
    ...activeAlbums.map(a => ({ value: a.id, label: a.name })),
  ];

  const resetForms = () => {
    setPhotoForm({ title: '', description: '', imageUrl: '', thumbnailUrl: '', albumId: '', tags: [], watermark: false, copyright: '' });
    setAlbumForm({ name: '', description: '', isPublic: true });
    setEditingId(null);
    if (imageFileRef.current) imageFileRef.current.value = '';
    if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
  };

  const handleImageFile = async (file: File | undefined, kind: 'image' | 'thumbnail') => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_PHOTO_FILE_BYTES) {
      uiStore.showError(`Файл больше ${MAX_PHOTO_FILE_BYTES / (1024 * 1024)} МБ`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (kind === 'image') setPhotoForm(prev => ({ ...prev, imageUrl: dataUrl }));
      else setPhotoForm(prev => ({ ...prev, thumbnailUrl: dataUrl }));
    } catch {
      uiStore.showError('Не удалось прочитать изображение');
    }
  };
  const openCreateModal = () => { resetForms(); setModalMode('create'); setModalOpen(true); };
  const openEditModal = (item: Photo | Album) => {
    setModalMode('edit'); setEditingId(item.id);
    if (activeTab === 'photos') { const p = item as Photo; setPhotoForm({ title: p.title, description: p.description || '', imageUrl: p.imageUrl, thumbnailUrl: p.thumbnailUrl, albumId: p.albumId, tags: p.tags, watermark: p.watermark, copyright: p.copyright }); }
    else { const a = item as Album; setAlbumForm({ name: a.name, description: a.description || '', isPublic: a.isPublic }); }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'photos') {
        if (!photoForm.title || !photoForm.imageUrl) { uiStore.showError('Заполните обязательные поля'); return; }
        if (modalMode === 'create') await createPhoto(photoForm); else if (editingId) await updatePhoto(editingId, photoForm);
      } else {
        if (!albumForm.name) { uiStore.showError('Введите название'); return; }
        if (modalMode === 'create') await createAlbum(albumForm); else if (editingId) await updateAlbum(editingId, albumForm);
      }
      uiStore.showSuccess('Сохранено'); setModalOpen(false); resetForms();
    } catch { uiStore.showError('Ошибка'); }
  };

  const handleDelete = (id: string) => { uiStore.showConfirm('Удаление', 'Удалить?', async () => {
    if (activeTab === 'photos') await deletePhoto(id); else await deleteAlbum(id);
    uiStore.showSuccess('Удалено');
  }); };

  const photoColumns: TableColumn<Photo>[] = [
    { key: 'title', title: 'Название' },
    { key: 'albumId', title: 'Альбом', render: (v: unknown) => getAlbumById(v as string)?.name || '—' },
    { key: 'views', title: 'Просмотры', width: '90px' },
    { key: 'downloads', title: 'Скачивания', width: '110px' },
    { key: 'actions', title: '', width: '100px', render: (_: unknown, r: Photo) => (
      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => openEditModal(r)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></Button>
        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button>
      </div>
    )},
  ];

  const albumColumns: TableColumn<Album>[] = [
    { key: 'name', title: 'Название' },
    { key: 'description', title: 'Описание', render: (v: unknown) => (v as string)?.substring(0, 50) || '—' },
    { key: 'isPublic', title: 'Публичный', width: '100px', render: (v: unknown) => (v as boolean) ? 'Да' : 'Нет' },
    { key: 'actions', title: '', width: '100px', render: (_: unknown, r: Album) => (
      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => openEditModal(r)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></Button>
        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button>
      </div>
    )},
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1 className={styles.title}>Управление галереей</h1></div>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'photos' ? styles.active : ''}`} onClick={() => setActiveTab('photos')}>Фотографии</button>
        {isAdmin && <button className={`${styles.tab} ${activeTab === 'albums' ? styles.active : ''}`} onClick={() => setActiveTab('albums')}>Альбомы</button>}
      </div>
      <Card className={styles.toolbar}><Button variant="primary" onClick={openCreateModal}>Добавить {activeTab === 'photos' ? 'фотографию' : 'альбом'}</Button></Card>
      <Card padding="none">
        {activeTab === 'photos' && <Table columns={photoColumns} data={photos.filter(p => p.isActive)} keyField="id" loading={photosLoading} emptyText="Нет фотографий" />}
        {activeTab === 'albums' && <Table columns={albumColumns} data={albums.filter(a => a.isActive)} keyField="id" loading={albumsLoading} emptyText="Нет альбомов" />}
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? 'Добавить' : 'Редактировать'}
        footer={<div className={styles.modalFooter}><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button><Button variant="primary" onClick={handleSave}>Сохранить</Button></div>}>
        <div className={styles.form}>
          {activeTab === 'photos' && (<>
            <Input label="Название *" value={photoForm.title} onChange={e => { const v = e.target.value; setPhotoForm(prev => ({ ...prev, title: v })); }} />
            <Input label="Описание" value={photoForm.description || ''} onChange={e => { const v = e.target.value; setPhotoForm(prev => ({ ...prev, description: v })); }} />
            <div className={styles.imagePickField}>
              <span className={styles.imagePickLabel}>Изображение *</span>
              <div className={styles.imagePickRow}>
                <input ref={imageFileRef} type="file" accept="image/*" className={styles.imagePickHidden} aria-hidden onChange={e => { void handleImageFile(e.target.files?.[0], 'image'); e.target.value = ''; }} />
                <Button type="button" variant="secondary" onClick={() => imageFileRef.current?.click()}>Выбрать</Button>
                {photoForm.imageUrl ? <img src={photoForm.imageUrl} alt="" className={styles.imagePickPreview} /> : <span className={styles.imagePickHint}>Файл не выбран</span>}
              </div>
            </div>
            <div className={styles.imagePickField}>
              <span className={styles.imagePickLabel}>Миниатюра</span>
              <div className={styles.imagePickRow}>
                <input ref={thumbnailFileRef} type="file" accept="image/*" className={styles.imagePickHidden} aria-hidden onChange={e => { void handleImageFile(e.target.files?.[0], 'thumbnail'); e.target.value = ''; }} />
                <Button type="button" variant="secondary" onClick={() => thumbnailFileRef.current?.click()}>Выбрать</Button>
                {photoForm.thumbnailUrl ? (<><img src={photoForm.thumbnailUrl} alt="" className={styles.imagePickPreview} /><Button type="button" variant="ghost" size="sm" onClick={() => setPhotoForm(prev => ({ ...prev, thumbnailUrl: '' }))}>Убрать</Button></>) : <span className={styles.imagePickHint}>Необязательно</span>}
              </div>
            </div>
            <Select label="Альбом" options={albumOptions} value={photoForm.albumId} placeholder="" onChange={e => { const v = e.target.value; setPhotoForm(prev => ({ ...prev, albumId: v })); }} />
            <Input label="Авторские права" value={photoForm.copyright} onChange={e => { const v = e.target.value; setPhotoForm(prev => ({ ...prev, copyright: v })); }} />
            <div className={styles.checkboxRow}><input type="checkbox" checked={photoForm.watermark} onChange={e => { const v = e.target.checked; setPhotoForm(prev => ({ ...prev, watermark: v })); }} id="watermark" /><label htmlFor="watermark">Водяной знак</label></div>
          </>)}
          {activeTab === 'albums' && (<>
            <Input label="Название *" value={albumForm.name} onChange={e => { const v = e.target.value; setAlbumForm(prev => ({ ...prev, name: v })); }} />
            <Input label="Описание" value={albumForm.description || ''} onChange={e => { const v = e.target.value; setAlbumForm(prev => ({ ...prev, description: v })); }} />
            <div className={styles.checkboxRow}><input type="checkbox" checked={albumForm.isPublic} onChange={e => { const v = e.target.checked; setAlbumForm(prev => ({ ...prev, isPublic: v })); }} id="public" /><label htmlFor="public">Публичный альбом</label></div>
          </>)}
        </div>
      </Modal>
    </div>
  );
});
