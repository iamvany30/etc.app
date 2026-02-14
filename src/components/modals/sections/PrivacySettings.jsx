import React, { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import { apiClient } from '../../../api/client';

const PrivacySettings = ({ setStatus }) => {
    const { currentUser, setCurrentUser } = useUser();

     
    const [settings, setSettings] = useState({
        wallClosed: false,
        onlinePrivacy: 'everyone',
        showLastSeen: true  
    });
    
    const [loading, setLoading] = useState(true);

     
    useEffect(() => {
        setLoading(true);
        apiClient.getPrivacySettings().then(res => {
            const fetchedSettings = res?.data || res;
            if (fetchedSettings && !fetchedSettings.error) {
                 
                setSettings({
                    wallClosed: fetchedSettings.wallClosed ?? false,
                    onlinePrivacy: fetchedSettings.onlinePrivacy ?? 'everyone',
                    showLastSeen: fetchedSettings.showLastSeen ?? true,
                });
                 
                setCurrentUser(prev => ({...prev, privacySettings: fetchedSettings}));
            }
        }).catch(e => {
            console.error("Failed to fetch privacy settings", e);
            setStatus({ type: 'error', msg: 'Не удалось загрузить настройки' });
        }).finally(() => setLoading(false));
    }, [setCurrentUser, setStatus]);

     
    const handleSettingChange = async (key, value) => {
        if (loading) return;

        const oldSettings = { ...settings };
        
         
        setSettings(prev => ({ ...prev, [key]: value }));
        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const payload = { [key]: value };
            const res = await apiClient.updatePrivacySettings(payload);

            if (res && !res.error) {
                 
                setCurrentUser(prevUser => ({
                    ...prevUser,
                    privacySettings: {
                        ...(prevUser?.privacySettings || {}),
                        ...payload
                    }
                }));
                setStatus({ type: 'success', msg: 'Сохранено' });
            } else {
                throw new Error(res?.error?.message || 'Ошибка сервера');
            }
        } catch (e) {
             
            setSettings(oldSettings);
            setStatus({ type: 'error', msg: 'Не удалось сохранить' });
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-content">
              
            <div className="settings-section-title">Стена и профиль</div>
            <div className="settings-option" onClick={() => handleSettingChange('wallClosed', !settings.wallClosed)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Закрытая стена</span>
                    <span className="settings-option-desc">
                        Публиковать посты сможете только вы.
                    </span>
                </div>
                <button className={`toggle-switch ${settings.wallClosed ? 'active' : ''}`} disabled={loading}>
                    <span className="toggle-thumb" />
                </button>
            </div>

              
            <div className="settings-section-title">Статус "В сети"</div>
            <div className="settings-option" style={{ cursor: 'default' }}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Кто видит мой онлайн</span>
                    <span className="settings-option-desc">Настройка отображения статуса</span>
                </div>
                
                <select 
                    className="settings-select"
                    value={settings.onlinePrivacy}
                    onChange={(e) => handleSettingChange('onlinePrivacy', e.target.value)}
                    disabled={loading}
                >
                    <option value="everyone">Все видят (точное время)</option>
                    <option value="hide_time">Все (без точного времени)</option>
                    <option value="nobody">Никто (Я оффлайн)</option>
                </select>
            </div>

              
            <div className="settings-option" onClick={() => handleSettingChange('showLastSeen', !settings.showLastSeen)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Время последнего визита</span>
                    <span className="settings-option-desc">
                        Показывать точное время, когда вы были в сети.
                    </span>
                </div>
                <button className={`toggle-switch ${settings.showLastSeen ? 'active' : ''}`} disabled={loading}>
                    <span className="toggle-thumb" />
                </button>
            </div>
        </div>
    );
};

export default PrivacySettings;