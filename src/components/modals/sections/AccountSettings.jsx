/* @source src/components/modals/sections/AccountSettings.jsx */
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { Shimmer } from '../../Skeletons';
import { useModalStore } from '../../../store/modalStore';
import VerificationModal from '../VerificationModal';
import { VerifiedCheck, ClockCircle, DangerCircle } from "@solar-icons/react";

const AccountSettings = ({ user, setCurrentUser, setStatus }) => {
    const openModal = useModalStore(state => state.openModal);

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        username: user?.username || '',
        bio: user?.bio || ''
    });
    const [loading, setLoading] = useState(false);
    
    const [pins, setPins] = useState([]);
    const [pinsLoading, setPinsLoading] = useState(true);
    
    
    const [verificationStatus, setVerificationStatus] = useState('none');

    
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                
                const pinsRes = await (apiClient.getMyPins ? apiClient.getMyPins() : window.api.call('/users/me/pins', 'GET'));
                if (isMounted) {
                    if (pinsRes && Array.isArray(pinsRes.data)) {
                        setPins(pinsRes.data);
                    } else {
                        setPins([]); 
                    }
                }
                
                
                if (!user?.isVerified) {
                    const verifRes = await (apiClient.getVerificationStatus 
                        ? apiClient.getVerificationStatus() 
                        : window.api.call('/verification/status', 'GET'));
                    
                    const verifData = verifRes?.data || verifRes || {};
                    if (isMounted && verifData.status) {
                        setVerificationStatus(verifData.status);
                    }
                }

            } catch(e) {
                console.error("Ошибка загрузки данных аккаунта:", e);
            } finally {
                if (isMounted) setPinsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [user?.isVerified]);

    
    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await apiClient.updateProfile(formData);
            if (res && !res.error) {
                setCurrentUser({ ...user, ...res.data, ...res });
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

    
    const togglePin = async (slug, isActive) => {
        try {
            if (isActive) {
                await apiClient.removeActivePin();
                setPins(pins.map(p => ({ ...p, isActive: false })));
            } else {
                await apiClient.setActivePin(slug);
                setPins(pins.map(p => ({ ...p, isActive: p.slug === slug })));
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка привязки пина' });
        }
    };

    return (
        <div className="settings-form">
            <div className="settings-section-title">Личные данные</div>
            <div className="form-group">
                <label className="form-label">Отображаемое имя</label>
                <input 
                    className="form-input" 
                    value={formData.displayName} 
                    onChange={e => setFormData({...formData, displayName: e.target.value})} 
                    maxLength={50} 
                />
            </div>
            <div className="form-group">
                <label className="form-label">Юзернейм</label>
                <input 
                    className="form-input" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                />
            </div>
            <div className="form-group">
                <label className="form-label">О себе</label>
                <textarea 
                    className="form-textarea" 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                    rows={3} 
                    maxLength={160} 
                    style={{resize: 'vertical'}}
                />
            </div>

            <div className="settings-section-title">Верификация</div>
            
            {user?.isVerified ? (
                
                <div style={{
                    background: 'rgba(29, 155, 240, 0.1)', 
                    padding: '12px 16px', borderRadius: '16px', 
                    color: '#1d9bf0', fontSize: '14px', fontWeight: '600',
                    border: '1px solid rgba(29, 155, 240, 0.2)', 
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <VerifiedCheck size={24} variant="Bold" /> 
                    Ваш аккаунт подтвержден
                </div>
            ) : verificationStatus === 'pending' ? (
                
                <div style={{
                    background: 'rgba(255, 173, 31, 0.1)', 
                    padding: '12px 16px', borderRadius: '16px', 
                    color: '#ffad1f', fontSize: '14px', fontWeight: '600',
                    border: '1px solid rgba(255, 173, 31, 0.2)', 
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer'
                }} onClick={() => openModal(<VerificationModal />)}>
                    <ClockCircle size={24} variant="Bold" /> 
                    Заявка на рассмотрении
                </div>
            ) : (
                
                <div className="settings-option" onClick={() => openModal(<VerificationModal />)}>
                    <div className="settings-option-info">
                        <span className="settings-option-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {verificationStatus === 'rejected' ? (
                                <span style={{color: '#f4212e', display: 'flex', gap: 6, alignItems: 'center'}}>
                                    Заявка отклонена <DangerCircle size={16} />
                                </span>
                            ) : (
                                <>Получить галочку <VerifiedCheck size={16} color="var(--color-text-secondary)" /></>
                            )}
                        </span>
                        <span className="settings-option-desc">
                            {verificationStatus === 'rejected' ? 'Нажмите, чтобы узнать причину и подать заново' : 'Подать заявку на верификацию профиля'}
                        </span>
                    </div>
                    <button className="settings-save-btn secondary" style={{ width: 'auto', margin: 0, padding: '6px 16px', fontSize: '13px' }}>
                        {verificationStatus === 'rejected' ? 'Повторить' : 'Подать'}
                    </button>
                </div>
            )}

            <div className="settings-section-title">Управление пинами</div>
            {pinsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2].map(i => (
                        <div key={i} className="settings-option" style={{ pointerEvents: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                                <Shimmer style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                                <div className="settings-option-info" style={{ flex: 1 }}>
                                    <Shimmer className="skeleton-text w-40" style={{ margin: 0, height: 14 }} />
                                    <Shimmer className="skeleton-text w-70" style={{ margin: '6px 0 0', height: 12, opacity: 0.6 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (!Array.isArray(pins) || pins.length === 0) ? (
                <div style={{background: 'var(--color-item-bg)', padding: '20px', borderRadius: '16px', color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center', border: '1px solid var(--color-border)'}}>
                    У вас ещё нет пинов. Они выдаются за участие в ивентах платформы.
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    {pins.map(pin => (
                        <div key={pin.slug} className="settings-option" onClick={() => togglePin(pin.slug, pin.isActive)}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                                <img 
                                    src={`/assets/pins/${pin.slug}.png`} 
                                    alt={pin.name} 
                                    style={{width: 36, height: 36}} 
                                    onError={(e) => e.target.style.display='none'}
                                />
                                <div className="settings-option-info">
                                    <span className="settings-option-name">{pin.name}</span>
                                    <span className="settings-option-desc">{pin.description}</span>
                                </div>
                            </div>
                            <div className={`toggle-switch ${pin.isActive ? 'active' : ''}`}>
                                <span className="toggle-thumb" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="settings-save-btn" onClick={handleSave} disabled={loading} style={{marginTop: 32}}>
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
        </div>
    );
};

export default AccountSettings;