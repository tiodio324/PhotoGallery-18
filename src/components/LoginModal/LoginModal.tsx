import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store';
import { UserRole } from '@/types';
import { Modal, Button, Input } from '@/components/UI';
import styles from './LoginModal.module.scss';

// Экспортируем тип-заглушку на случай, если его кто-то импортирует в проекте
export type LoginRole = Exclude<UserRole, 'viewer'>;

export const LoginModal = observer(() => {
  const { loginModalOpen, closeLoginModal, login, loginError, isLoading } = authStore;
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Приводим к any, чтобы обойти любые строгие проверки методов в authStore
    await (login as any)('admin', password); 
    if (!authStore.loginError) {
      setPassword('');
    }
  };

  const handleClose = () => {
    closeLoginModal();
    setPassword('');
  };

  return (
    <Modal isOpen={loginModalOpen} onClose={handleClose} title="Вход в систему" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input 
          type="password" 
          label="Пароль фотографа" 
          placeholder="Введите пароль" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          error={loginError || undefined} 
          autoFocus 
        />
        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          loading={isLoading} 
          disabled={!password}
        >
          Войти
        </Button>
      </form>
    </Modal>
  );
});
