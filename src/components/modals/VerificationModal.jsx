/* @source src/components/modals/VerificationModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';
import { apiClient } from '../../api/client'; 
import { VerifiedCheck, UploadSquare, VideoFrame, ClockCircle, DangerCircle, CloseCircle } from "@solar-icons/react";

const VerificationModal = () => {
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    
    const [status, setStatus] = useState('loading'); 
    const [rejectReason, setRejectReason] = useState(null);
    const [loading, setLoading] = useState(false);
    
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    
    useEffect(() => {
        const checkStatus = async () => {
            try {
                
                const res = await (apiClient.getVerificationStatus 
                    ? apiClient.getVerificationStatus() 
                    : window.api.call('/verification/status', 'GET'));

                const data = res?.data || res || {};
                
                if (data.status) {
                    setStatus(data.status);
                    if (data.rejectReason) setRejectReason(data.rejectReason);
                } else {
                    setStatus('none');
                }
            } catch (e) {
                console.error(e);
                setStatus('none');
            }
        };
        checkStatus();
    }, []);

    
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('video/')) {
                setSelectedFile(file);
            } else {
                showIslandAlert('error', 'Пожалуйста, выберите видеофайл', '📹');
            }
        }
    };

    
    const handleSubmit = async () => {
        if (!selectedFile) return;
        
        setLoading(true);
        setUploadProgress(10); 

        try {
            
            const uploadRes = await apiClient.uploadFile(selectedFile, (statusText) => {
                
                if (statusText === 'Загрузка...') setUploadProgress(50);
            });

            if (uploadRes?.error) throw new Error(uploadRes.error.message || 'Ошибка загрузки видео');
            
            const attachmentId = uploadRes.data?.id || uploadRes.id;
            setUploadProgress(90);

            
            const submitMethod = apiClient.submitVerification 
                ? apiClient.submitVerification 
                : (d) => window.api.call('/verification/submit', 'POST', d);

            const res = await submitMethod({ attachmentId });

            if (!res.error) {
                showIslandAlert('success', 'Заявка отправлена!', '✅');
                setStatus('pending');
            } else {
                throw new Error(res.error.message);
            }

        } catch (e) {
            showIslandAlert('error', e.message || 'Ошибка отправки', '❌');
            setLoading(false);
            setUploadProgress(0);
        }
    };

    
    if (status === 'loading') {
        return (
            <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner-mini" style={{ width: 24, height: 24 }} />
            </div>
        );
    }

    
    if (status === 'pending') {
        return (
            <div style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', color: '#ffad1f', marginBottom: '16px' }}>
                    <ClockCircle size={48} variant="Bold" />
                </div>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800' }}>На рассмотрении</h2>
                <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    Мы уже получили вашу заявку. Модераторы проверят видео в ближайшее время. Вы получите уведомление о решении.
                </p>
                <button 
                    onClick={closeModal}
                    style={{
                        width: '100%', padding: '14px', borderRadius: '99px',
                        background: 'var(--color-input-bg)', border: 'none',
                        color: 'var(--color-text)', fontWeight: '700', cursor: 'pointer'
                    }}
                >
                    Закрыть
                </button>
            </div>
        );
    }

    
    return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: status === 'rejected' ? '#f4212e' : '#1d9bf0', marginBottom: '16px' }}>
                {status === 'rejected' ? <DangerCircle size={48} variant="Bold" /> : <VerifiedCheck size={48} variant="Bold" />}
            </div>
            
            <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800' }}>
                {status === 'rejected' ? 'Заявка отклонена' : 'Верификация аккаунта'}
            </h2>

            {status === 'rejected' && (
                <div style={{ background: 'rgba(244, 33, 46, 0.1)', color: '#f4212e', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
                    <b>Причина:</b> {rejectReason || 'Видео не соответствует требованиям'}
                </div>
            )}
            
            <p style={{ margin: '0 0 24px 0', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                Запишите короткое видео, где вы говорите: <br/>
                <b>"Я владелец аккаунта @{JSON.parse(localStorage.getItem('nowkie_user') || '{}').username} в итд.app"</b>.
            </p>

            {}
            {!selectedFile ? (
                <div 
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        border: '2px dashed var(--color-border)', borderRadius: '16px',
                        padding: '24px', marginBottom: '24px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                        background: 'var(--color-input-bg)', transition: '0.2s'
                    }}
                >
                    <input 
                        type="file" 
                        accept="video/*" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        hidden 
                    />
                    <UploadSquare size={32} color="var(--color-primary)" />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Выбрать видеофайл</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>MP4, MOV (макс. 50 МБ)</span>
                </div>
            ) : (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: 'var(--color-input-bg)',
                    borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--color-border)'
                }}>
                    <VideoFrame size={24} color="var(--color-primary)" />
                    <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>
                    {!loading && (
                        <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                            <CloseCircle size={20} />
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                    onClick={closeModal}
                    disabled={loading}
                    style={{
                        flex: 1, padding: '14px', borderRadius: '99px',
                        background: 'transparent', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', fontWeight: '700', cursor: 'pointer'
                    }}
                >
                    Отмена
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={loading || !selectedFile}
                    style={{
                        flex: 1, padding: '14px', borderRadius: '99px',
                        background: '#1d9bf0', border: 'none',
                        color: '#fff', fontWeight: '700', cursor: loading || !selectedFile ? 'default' : 'pointer',
                        opacity: loading || !selectedFile ? 0.6 : 1,
                        position: 'relative', overflow: 'hidden'
                    }}
                >
                    {loading ? `Загрузка ${uploadProgress}%` : 'Отправить'}
                </button>
            </div>
        </div>
    );
};

export default VerificationModal;