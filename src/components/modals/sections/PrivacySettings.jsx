import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../../store/userStore';
import { apiClient } from '../../../api/client';
import { SettingsSkeleton } from '../../Skeletons';

const PrivacySettings = ({ setStatus }) => {
    const currentUser = useUserStore(state => state.currentUser);
    const setCurrentUser = useUserStore(state => state.setCurrentUser);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [settings, setSettings] = useState({
        isPrivate: false,
        wallAccess: "everyone", 
        likesVisibility: "everyone",
        showLastSeen: true
    });

    useEffect(() => {
        let isMounted = true;
        const fetchPrivacy = async () => {
            try {
                const res = await (apiClient.getPrivacySettings 
                    ? apiClient.getPrivacySettings() 
                    : window.api.call('/users/me/privacy', 'GET'));
                
                const data = res?.data || res || {};

                if (isMounted && Object.keys(data).length > 0) {
                    setSettings({
                        isPrivate: !!data.isPrivate,
                        wallAccess: data.wallAccess || "everyone",
                        likesVisibility: data.likesVisibility || "everyone",
                        showLastSeen: data.showLastSeen ?? true
                    });
                }
            } catch (e) {
                console.error("[PrivacySettings] Ошибка загрузки:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPrivacy();
        return () => { isMounted = false; };
    }, []);

    const handleSave = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings); 
        setSaving(true);

        try {
            const payload = {
                isPrivate: newSettings.isPrivate,
                wallAccess: newSettings.wallAccess,
                likesVisibility: newSettings.likesVisibility,
                showLastSeen: newSettings.showLastSeen
            };
            
            const updateMethod = apiClient.updatePrivacySettings || apiClient.updatePrivacy;
            const res = updateMethod 
                ? await updateMethod(payload)
                : await window.api.call('/users/me/privacy', 'PUT', payload);

            if (res && (!res.error || res.success)) {
                setCurrentUser({ 
                    ...currentUser, 
                    privacySettings: payload,
                    isPrivate: payload.isPrivate
                });
                setStatus({ type: 'success', msg: 'Настройки обновлены' });
            } else {
                throw new Error(res?.error?.message || 'Ошибка сохранения');
            }
        } catch (e) {
            setSettings(settings); 
            setStatus({ type: 'error', msg: e.message || 'Не удалось сохранить' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <SettingsSkeleton count={4} />;

    return (
        <div className="settings-content">
            <div className="settings-section-title">Видимость и статус</div>
            <div className="settings-option" onClick={() => handleSave('showLastSeen', !settings.showLastSeen)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Показывать статус "В сети"</span>
                    <span className="settings-option-desc">Отображать время вашего последнего визита</span>
                </div>
                <button className={`toggle-switch ${settings.showLastSeen ? 'active' : ''}`} disabled={saving}>
                    <span className="toggle-thumb" />
                </button>
            </div>
            
            <div className="settings-option" onClick={() => handleSave('isPrivate', !settings.isPrivate)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Закрытый аккаунт</span>
                    <span className="settings-option-desc">Только одобренные подписчики увидят ваши посты</span>
                </div>
                <button className={`toggle-switch ${settings.isPrivate ? 'active' : ''}`} disabled={saving}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            <div className="settings-section-title">Ограничения контента</div>
            <div className="settings-option" style={{ cursor: 'default', flexWrap: 'wrap', gap: '16px' }}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Записи на стене</span>
                    <span className="settings-option-desc">Кто может писать посты в вашем профиле</span>
                </div>
                <select 
                    className="form-select" 
                    style={{ width: '200px' }}
                    value={settings.wallAccess} 
                    onChange={(e) => handleSave('wallAccess', e.target.value)} 
                    disabled={saving}
                >
                    <option value="everyone">Все пользователи</option>
                    <option value="followers">Только подписчики</option>
                    <option value="mutual">Взаимные подписки</option>
                    <option value="nobody">Никто</option>
                </select>
            </div>

            <div className="settings-option" style={{ cursor: 'default', flexWrap: 'wrap', gap: '16px' }}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Видимость лайков</span>
                    <span className="settings-option-desc">Кто видит список лайкнутых вами постов</span>
                </div>
                <select 
                    className="form-select" 
                    style={{ width: '200px' }}
                    value={settings.likesVisibility} 
                    onChange={(e) => handleSave('likesVisibility', e.target.value)} 
                    disabled={saving}
                >
                    <option value="everyone">Все пользователи</option>
                    <option value="followers">Только подписчики</option>
                    <option value="mutual">Взаимные подписки</option>
                    <option value="nobody">Никто</option>
                </select>
            </div>
        </div>
    );
};

export default PrivacySettings;