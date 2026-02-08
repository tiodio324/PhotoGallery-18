import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { navigationStore, dataStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, GalleryPage, AlbumsPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;
  switch (currentPage) {
    case 'home': return <HomePage />;
    case 'gallery': return <GalleryPage />;
    case 'albums': return <AlbumsPage />;
    case 'admin': case 'admin-photos': case 'admin-albums': return <AdminPage />;
    default: return <HomePage />;
  }
});

const App = observer(() => { useEffect(() => { dataStore.loadAllData(); }, []); return (<><MainLayout><PageRouter /></MainLayout><LoginModal /><ConfirmModal /><Toast /></>); });
export default App;
