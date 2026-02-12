import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';

const PrivacySettings = ({ setStatus }) => {
    const [wallClosed, setWallClosed] = useState(false);
    const [loading, setLoading] = useState(false);

     
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.getPrivacySettings();
                if (res && !res.error) {
                    setWallClosed(res.wallClosed);
                }
            } catch (e) {
                console.error("Failed to fetch privacy settings", e);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = async () => {
        if (loading) return;
        setLoading(true);

         
        const newValue = !wallClosed;
        setWallClosed(newValue);
        setStatus({ type: '', msg: '' });  

        try {
            const res = await apiClient.updatePrivacySettings({ wallClosed: newValue });
            
            if (res && !res.error) {
                setStatus({ type: 'success', msg: 'Настройки приватности сохранены' });
            } else {
                throw new Error(res?.error?.message || 'Ошибка сервера');
            }
        } catch (e) {
             
            setWallClosed(!newValue);
            setStatus({ type: 'error', msg: 'Не удалось сохранить настройки' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-content">
            <div className="settings-section-title">Стена и профиль</div>

            <div className="settings-option" onClick={handleToggle}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Закрытая стена</span>
                    <span className="settings-option-desc">
                        Если включено, только вы сможете публиковать записи в своём профиле. 
                        Другие пользователи смогут только комментировать ваши посты.
                    </span>
                </div>
                <button className={`toggle-switch ${wallClosed ? 'active' : ''}`} disabled={loading}>
                    <span className="toggle-thumb" />
                </button>
            </div>
        </div>
    );
};

export default PrivacySettings;