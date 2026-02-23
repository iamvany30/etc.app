import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { SettingsSkeleton } from '../../Skeletons';

const NotificationSettings = ({ setStatus }) => {
    const [settings, setSettings] = useState({
        enabled: true, sound: true, follows: true, 
        wallPosts: true, likes: true, comments: true, mentions: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.getSettings();
                if (res.data) setSettings({ ...settings, ...res.data });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    
    }, []);

    const toggle = (key) => setSettings({ ...settings, [key]: !settings[key] });

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await apiClient.updateSettings(settings);
            if (res.success || !res.error) {
                setStatus({ type: 'success', msg: 'Настройки уведомлений сохранены' });
            } else {
                setStatus({ type: 'error', msg: res.error?.message || 'Ошибка' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка сети' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <SettingsSkeleton count={6} />;

    const ToggleRow = ({ name, desc, stateKey, disabled }) => (
        <div className="settings-option" onClick={() => !disabled && toggle(stateKey)}>
            <div className="settings-option-info">
                <span className="settings-option-name">{name}</span>
                {desc && <span className="settings-option-desc">{desc}</span>}
            </div>
            <button className={`toggle-switch ${settings[stateKey] ? 'active' : ''}`} disabled={disabled}>
                <span className="toggle-thumb" />
            </button>
        </div>
    );

    return (
        <div className="settings-content">
            <div className="settings-section-title">Основные</div>
            <ToggleRow name="Уведомления" desc="Глобальный переключатель всех уведомлений" stateKey="enabled" />
            <ToggleRow name="Звук уведомлений" desc="Воспроизводить системный звук" stateKey="sound" disabled={!settings.enabled} />
            
            <div className="settings-section-title">События</div>
            <ToggleRow name="Подписки" desc="Новые читатели и запросы" stateKey="follows" disabled={!settings.enabled} />
            <ToggleRow name="Лайки и реакции" desc="Реакции на ваши посты и комментарии" stateKey="likes" disabled={!settings.enabled} />
            <ToggleRow name="Комментарии" desc="Ответы и новые комментарии" stateKey="comments" disabled={!settings.enabled} />
            <ToggleRow name="Упоминания" desc="Упоминания через @username" stateKey="mentions" disabled={!settings.enabled} />
            <ToggleRow name="Записи на стене" desc="Новые посты в вашем профиле" stateKey="wallPosts" disabled={!settings.enabled} />

            <button className="settings-save-btn" onClick={handleSave} disabled={saving} style={{marginTop: 24}}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
        </div>
    );
};

export default NotificationSettings;