import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { useModalStore } from '../../../store/modalStore';
import DeleteAccountModal from '../DeleteAccountModal';

const SecuritySettings = ({ setStatus }) => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const openModal = useModalStore(s => s.openModal);

    const [pin, setPin] = useState('');
    const [isLockEnabled, setIsLockEnabled] = useState(false);

    useEffect(() => {
        setIsLockEnabled(localStorage.getItem('itd_app_lock_enabled') === 'true');
        setPin(localStorage.getItem('itd_app_lock_pin') || '');
    }, []);

    const handleSavePin = () => {
        if (isLockEnabled && pin.length < 4) {
            setStatus({ type: 'error', msg: 'ПИН-код должен содержать минимум 4 цифры' });
            return;
        }
        localStorage.setItem('itd_app_lock_enabled', isLockEnabled ? 'true' : 'false');
        localStorage.setItem('itd_app_lock_pin', pin);
        setStatus({ type: 'success', msg: 'Настройки блокировки сохранены' });
    };

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
                setStatus({ type: 'success', msg: 'Пароль успешно изменен' });
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

    const handleExport = async () => {
        setExporting(true);
        setStatus({ type: '', msg: 'Запрос данных...' });
        try {
            const res = await apiClient.exportData();
            
            if (res && !res.error) {
                const fileUrl = res.url || res.data?.url || res.downloadUrl || res.data?.downloadUrl;
                if (fileUrl) {
                    if (window.api?.downloadFile) {
                        window.api.downloadFile(fileUrl);
                    } else {
                        window.location.href = fileUrl;
                    }
                    setStatus({ type: 'success', msg: 'Загрузка архива начата' });
                } else {
                    const dataStr = JSON.stringify(res.data || res, null, 2);
                    const blob = new Blob([dataStr], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `itd_export_${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    setStatus({ type: 'success', msg: 'Данные успешно выгружены' });
                }
            } else {
                setStatus({ type: 'error', msg: res.error?.message || 'Ошибка выгрузки' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка сети' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="settings-form">
            <div className="settings-section-title">Блокировка приложения</div>
            <div className="settings-option" onClick={() => setIsLockEnabled(!isLockEnabled)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Вход по ПИН-коду и Биометрии</span>
                    <span className="settings-option-desc">Запрашивать ПИН-код или сканирование при открытии приложения</span>
                </div>
                <button className={`toggle-switch ${isLockEnabled ? 'active' : ''}`}>
                    <span className="toggle-thumb" />
                </button>
            </div>
            {isLockEnabled && (
                <div className="form-group" style={{marginTop: 10}}>
                    <label className="form-label">Установите ПИН-код</label>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="Минимум 4 цифры"
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                        maxLength={10}
                    />
                </div>
            )}
            <button className="settings-save-btn" onClick={handleSavePin} style={{marginBottom: 24}}>
                Сохранить настройки блокировки
            </button>

            <div className="settings-section-title">Изменение пароля</div>
            <div className="form-group">
                <label className="form-label">Текущий пароль</label>
                <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Введите текущий пароль"
                    value={passwords.current} 
                    onChange={e => setPasswords({...passwords, current: e.target.value})} 
                />
            </div>
            <div className="form-group">
                <label className="form-label">Новый пароль</label>
                <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Не менее 8 символов"
                    value={passwords.new} 
                    onChange={e => setPasswords({...passwords, new: e.target.value})} 
                />
            </div>
            <div className="form-group">
                <label className="form-label">Подтвердите пароль</label>
                <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Повторите новый пароль"
                    value={passwords.confirm} 
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                />
            </div>
            <button className="settings-save-btn" onClick={handleSave} disabled={loading || !passwords.new}>
                {loading ? 'Обновление...' : 'Сменить пароль'}
            </button>

            <div className="settings-section-title">Управление данными</div>
            
            <div className="settings-option" onClick={handleExport} style={{ pointerEvents: exporting ? 'none' : 'auto', opacity: exporting ? 0.6 : 1 }}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Скачать архив данных</span>
                    <span className="settings-option-desc">Экспорт ваших постов, комментариев и настроек</span>
                </div>
                <button className="settings-save-btn secondary" style={{ width: 'auto', margin: 0, padding: '8px 20px' }}>
                    {exporting ? 'Сбор...' : 'Скачать'}
                </button>
            </div>

            <div className="settings-option" onClick={() => openModal(<DeleteAccountModal />)}>
                <div className="settings-option-info">
                    <span className="settings-option-name" style={{ color: '#f4212e' }}>Удалить аккаунт</span>
                    <span className="settings-option-desc">Полное и безвозвратное удаление всех ваших данных</span>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;