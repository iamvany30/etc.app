import React, { useState } from 'react';
import { apiClient } from '../../../api/client';

const AccountSettings = ({ user, setCurrentUser, setStatus }) => {
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        username: user?.username || '',
        bio: user?.bio || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await apiClient.updateProfile(formData);
            if (res && !res.error) {
                setCurrentUser(prev => ({ ...prev, ...res }));
                setStatus({ type: 'success', msg: 'Профиль сохранен' });
            } else {
                setStatus({ type: 'error', msg: res?.error?.message || 'Ошибка' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка сети' });
        } finally {
            setLoading(false);
        }
    };

    return (
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
                <textarea className="form-textarea" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={4} />
            </div>
            <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
        </div>
    );
};

export default AccountSettings;