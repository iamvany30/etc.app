import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useModal } from '../../context/ModalContext';
import { apiClient } from '../../api/client';
import '../../styles/SettingsModal.css';

const ArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const ChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const ShieldIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const MoonIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const SnowIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8M12 8v8"/></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const SettingsModal = () => {
    const { currentUser, setCurrentUser } = useUser();
    const { closeModal } = useModal();
    const [view, setView] = useState('main');
    const [theme, setTheme] = useState(localStorage.getItem('nowkie_theme') || 'dark');
    const [snowEnabled, setSnowEnabled] = useState(localStorage.getItem('nowkie_snow_enabled') === 'true');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [formData, setFormData] = useState({
        displayName: currentUser?.displayName || '',
        username: currentUser?.username || '',
        bio: currentUser?.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        wallClosed: false
    });

    useEffect(() => {
        setStatus({ type: '', msg: '' });
        if (view === 'privacy') fetchPrivacy();
    }, [view]);

    const fetchPrivacy = async () => {
        setIsFetching(true);
        try {
            const res = await apiClient.getPrivacySettings();
            if (res && !res.error) setFormData(p => ({ ...p, wallClosed: res.wallClosed }));
        } catch (e) { console.error(e); }
        finally { setIsFetching(false); }
    };

    const handleSaveProfile = async () => {
        if (!formData.displayName.trim()) {
            setStatus({ type: 'error', msg: 'Имя не может быть пустым' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiClient.updateProfile({
                displayName: formData.displayName,
                username: formData.username,
                bio: formData.bio
            });
            if (res && !res.error) {
                setCurrentUser(prev => ({ ...prev, ...res }));
                setStatus({ type: 'success', msg: 'Профиль успешно обновлен' });
            } else {
                setStatus({ type: 'error', msg: res?.error?.message || 'Ошибка обновления' });
            }
        } catch (e) { setStatus({ type: 'error', msg: 'Ошибка соединения' }); }
        finally { setIsLoading(false); }
    };

    const handleSavePassword = async () => {
        if (!formData.currentPassword || !formData.newPassword) {
            setStatus({ type: 'error', msg: 'Заполните все поля' });
            return;
        }
        if (formData.newPassword.length < 8) {
            setStatus({ type: 'error', msg: 'Пароль должен быть от 8 символов' });
            return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: 'error', msg: 'Пароли не совпадают' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiClient.changePassword(formData.currentPassword, formData.newPassword);
            if (res && (res.success || !res.error)) {
                setStatus({ type: 'success', msg: 'Пароль изменен' });
                setFormData(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
            } else {
                setStatus({ type: 'error', msg: res?.error?.message || 'Неверный текущий пароль' });
            }
        } catch (e) { setStatus({ type: 'error', msg: 'Ошибка сервера' }); }
        finally { setIsLoading(false); }
    };

    const handleToggleWall = async () => {
        const next = !formData.wallClosed;
        setFormData(p => ({ ...p, wallClosed: next }));
        try {
            const res = await apiClient.updatePrivacySettings({ wallClosed: next });
            if (res?.error) {
                setFormData(p => ({ ...p, wallClosed: !next }));
                alert('Ошибка сохранения настроек');
            }
        } catch (e) { setFormData(p => ({ ...p, wallClosed: !next })); }
    };

    const handleToggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('nowkie_theme', next);
        window.dispatchEvent(new Event('settingsUpdate'));
    };

    const handleToggleSnow = () => {
        const next = !snowEnabled;
        setSnowEnabled(next);
        localStorage.setItem('nowkie_snow_enabled', next);
        window.dispatchEvent(new Event('settingsUpdate'));
    };

    const handleLogout = async () => {
        if (window.confirm('Выйти из аккаунта?')) {
            await window.api.call('/v1/auth/logout', 'POST');
            setCurrentUser(null);
            localStorage.removeItem('nowkie_user');
            closeModal();
            window.location.reload();
        }
    };

    const renderHeader = (title) => (
        <div className="settings-header">
            {view !== 'main' && (
                <button className="settings-back-btn" onClick={() => setView('main')}>
                    <ArrowLeft />
                </button>
            )}
            <h2 className="settings-title">{title}</h2>
        </div>
    );

    return (
        <div className="settings-modal">
            {view === 'main' && (
                <>
                    {renderHeader('Настройки')}
                    <div className="settings-content">
                        <div className="settings-section-title">Аккаунт</div>
                        <button className="settings-option" onClick={() => setView('personal')}>
                            <div className="settings-option-left">
                                <div className="settings-icon"><UserIcon /></div>
                                <div className="settings-option-info">
                                    <span className="settings-option-name">Личная информация</span>
                                    <span className="settings-option-desc">Имя, юзернейм, био</span>
                                </div>
                            </div>
                            <ChevronRight />
                        </button>
                        <button className="settings-option" onClick={() => setView('security')}>
                            <div className="settings-option-left">
                                <div className="settings-icon"><LockIcon /></div>
                                <div className="settings-option-info">
                                    <span className="settings-option-name">Пароль и безопасность</span>
                                </div>
                            </div>
                            <ChevronRight />
                        </button>
                        <button className="settings-option" onClick={() => setView('privacy')}>
                            <div className="settings-option-left">
                                <div className="settings-icon"><ShieldIcon /></div>
                                <div className="settings-option-info">
                                    <span className="settings-option-name">Приватность</span>
                                </div>
                            </div>
                            <ChevronRight />
                        </button>
                        <div className="settings-section-title">Оформление</div>
                        <div className="settings-option settings-toggle" onClick={handleToggleTheme}>
                            <div className="settings-option-left">
                                <div className="settings-icon"><MoonIcon /></div>
                                <span className="settings-option-name">Тёмная тема</span>
                            </div>
                            <button className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                        </div>
                        <div className="settings-option settings-toggle" onClick={handleToggleSnow}>
                            <div className="settings-option-left">
                                <div className="settings-icon"><SnowIcon /></div>
                                <span className="settings-option-name">Эффект снега</span>
                            </div>
                            <button className={`toggle-switch ${snowEnabled ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                        </div>
                        <button className="settings-option danger" onClick={handleLogout}>
                            <div className="settings-option-left">
                                <div className="settings-icon"><LogoutIcon /></div>
                                <span className="settings-option-name">Выйти из системы</span>
                            </div>
                        </button>
                    </div>
                </>
            )}
            {view === 'personal' && (
                <>
                    {renderHeader('Личные данные')}
                    <div className="settings-content">
                        {status.msg && <div className={`status-message ${status.type}`}>{status.msg}</div>}
                        <div className="settings-form">
                            <div className="form-group">
                                <label className="form-label">Отображаемое имя</label>
                                <input className="form-input" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} maxLength={50} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Юзернейм</label>
                                <input className="form-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">О себе</label>
                                <textarea className="form-textarea" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} />
                            </div>
                            <button className="settings-save-btn" onClick={handleSaveProfile} disabled={isLoading}>{isLoading ? '...' : 'Сохранить'}</button>
                        </div>
                    </div>
                </>
            )}
            {view === 'security' && (
                <>
                    {renderHeader('Безопасность')}
                    <div className="settings-content">
                        {status.msg && <div className={`status-message ${status.type}`}>{status.msg}</div>}
                        <div className="settings-form">
                            <div className="form-group"><label className="form-label">Текущий пароль</label>
                            <input type="password" className="form-input" value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">Новый пароль</label>
                            <input type="password" className="form-input" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} /></div>
                            <div className="form-group"><label className="form-label">Повторите пароль</label>
                            <input type="password" className="form-input" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} /></div>
                            <button className="settings-save-btn" onClick={handleSavePassword} disabled={isLoading}>{isLoading ? '...' : 'Обновить пароль'}</button>
                        </div>
                    </div>
                </>
            )}
            {view === 'privacy' && (
                <>
                    {renderHeader('Приватность')}
                    <div className="settings-content">
                        {isFetching ? <div className="loading-indicator">...</div> : (
                            <div className="settings-option settings-toggle" onClick={handleToggleWall}>
                                <div className="settings-option-left">
                                    <div className="settings-option-info">
                                        <span className="settings-option-name">Закрыть стену</span>
                                        <span className="settings-option-desc">Запретить другим оставлять записи в вашем профиле</span>
                                    </div>
                                </div>
                                <button className={`toggle-switch ${formData.wallClosed ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SettingsModal;