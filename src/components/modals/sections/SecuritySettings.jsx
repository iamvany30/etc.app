 
import React, { useState } from 'react';
import { apiClient } from '../../../api/client';

const SecuritySettings = ({ setStatus }) => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (passwords.new !== passwords.confirm) {
            setStatus({ type: 'error', msg: 'Пароли не совпадают' });
            return;
        }
        if (!passwords.new) return;  
        
        setLoading(true);
        try {
            const res = await apiClient.changePassword(passwords.current, passwords.new);
            if (res && !res.error) {
                setStatus({ type: 'success', msg: 'Пароль изменен' });
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                setStatus({ type: 'error', msg: 'Неверный текущий пароль' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка сервера' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-form">
            <div className="form-group">
                <label className="form-label">Текущий пароль</label>
                <input 
                    type="password" 
                    className="form-input" 
                    value={passwords.current} 
                    onChange={e => setPasswords({...passwords, current: e.target.value})} 
                />
            </div>
            <div className="form-group">
                <label className="form-label">Новый пароль</label>
                <input 
                    type="password" 
                    className="form-input" 
                    value={passwords.new} 
                    onChange={e => setPasswords({...passwords, new: e.target.value})} 
                />
            </div>
            <div className="form-group">
                <label className="form-label">Подтвердите пароль</label>
                <input 
                    type="password" 
                    className="form-input" 
                    value={passwords.confirm} 
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                />
            </div>
            <button className="settings-save-btn" onClick={handleSave} disabled={loading}>
                {loading ? 'Обновление...' : 'Сменить пароль'}
            </button>
        </div>
    );
};

export default SecuritySettings;