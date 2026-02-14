import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import { apiClient } from '../../../api/client';

const PrivacySettings = ({ setStatus }) => {
    const { currentUser, setCurrentUser } = useUser();
    const [loading, setLoading] = useState(false);

    
    const [settings, setSettings] = useState({
        isPrivate: false,
        wallAccess: "everyone", 
        likesVisibility: "everyone",
        showLastSeen: true
    });

    
    useEffect(() => {
        if (currentUser?.privacySettings) {
            setSettings({
                isPrivate: currentUser.privacySettings.isPrivate ?? false,
                wallAccess: currentUser.privacySettings.wallAccess ?? "everyone",
                likesVisibility: currentUser.privacySettings.likesVisibility ?? "everyone",
                showLastSeen: currentUser.privacySettings.showLastSeen ?? true
            });
        }
    }, [currentUser]);

    const handleSave = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings); 
        setLoading(true);

        try {
            
            const res = await apiClient.updatePrivacy(newSettings);

            if (res && !res.error) {
                
                setCurrentUser(prev => ({
                    ...prev,
                    privacySettings: { ...prev.privacySettings, ...newSettings }
                }));
                setStatus({ type: 'success', msg: 'Настройки обновлены' });
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (e) {
            setSettings(settings); 
            setStatus({ type: 'error', msg: 'Не удалось сохранить' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-content">
            
            <div className="settings-option" onClick={() => handleSave('showLastSeen', !settings.showLastSeen)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Показывать статус "В сети"</span>
                    <span className="settings-option-desc">
                        Если выключено, другие не увидят, когда вы онлайн.
                    </span>
                </div>
                <button className={`toggle-switch ${settings.showLastSeen ? 'active' : ''}`} disabled={loading}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            
            <div className="settings-option" style={{cursor: 'default'}}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Кто может писать на стене</span>
                </div>
                <select 
                    className="settings-select"
                    value={settings.wallAccess}
                    onChange={(e) => handleSave('wallAccess', e.target.value)}
                    disabled={loading}
                >
                    <option value="everyone">Все</option>
                    <option value="followers">Подписчики</option>
                    <option value="nobody">Только я</option>
                </select>
            </div>

            
            <div className="settings-option" onClick={() => handleSave('isPrivate', !settings.isPrivate)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Закрытый аккаунт</span>
                    <span className="settings-option-desc">
                        Только одобренные подписчики увидят ваши посты.
                    </span>
                </div>
                <button className={`toggle-switch ${settings.isPrivate ? 'active' : ''}`} disabled={loading}>
                    <span className="toggle-thumb" />
                </button>
            </div>
        </div>
    );
};

export default PrivacySettings;