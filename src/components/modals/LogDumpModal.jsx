import React, { useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { Bug } from "@solar-icons/react";

const LogDumpModal = () => {
    const closeModal = useModalStore(state => state.closeModal);
    const [status, setStatus] = useState('idle'); 
    const [path, setPath] = useState('');

    const handleDump = async () => {
        setStatus('working');
        try {
            const res = await window.api.invoke('app:dump-logs-zip');
            if (res.success) {
                setStatus('success');
                setPath(res.path);
            } else {
                setStatus('error');
            }
        } catch (e) {
            setStatus('error');
        }
    };

    return (
        <div className="log-dump-container">
            <style>{`
                .log-dump-container {
                    padding: 32px;
                    text-align: center;
                    width: 100%;
                    max-width: 420px;
                    margin: 0 auto; 
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .ld-icon-box {
                    width: 80px;
                    height: 80px;
                    border-radius: 24px;
                    background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.2), rgba(var(--color-primary-rgb), 0.05));
                    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
                    box-shadow: 0 12px 40px rgba(var(--color-primary-rgb), 0.15);
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary);
                }
                .ld-title {
                    font-size: 22px;
                    font-weight: 800;
                    margin: 0 0 12px 0;
                    color: var(--color-text);
                    letter-spacing: -0.5px;
                }
                .ld-desc {
                    color: var(--color-text-secondary);
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0 0 28px 0;
                }
                .ld-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                }
                .ld-btn {
                    flex: 1;
                    padding: 16px;
                    border-radius: 16px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.1s, opacity 0.2s, background-color 0.2s, box-shadow 0.2s;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .ld-btn:active { transform: scale(0.96); }
                .ld-btn.cancel {
                    background: transparent;
                    border: 1px solid var(--color-border);
                    color: var(--color-text);
                }
                .ld-btn.cancel:hover { background: var(--color-item-bg); }
                .ld-btn.confirm {
                    background: var(--color-text);
                    color: var(--color-background);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                .ld-btn.confirm:hover { 
                    opacity: 0.9; 
                    transform: translateY(-2px);
                }
                .ld-btn.confirm:active {
                    transform: translateY(0) scale(0.96);
                }
                .ld-path-box {
                    background: var(--color-input-bg);
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    font-size: 13px;
                    color: var(--color-text-secondary);
                    word-break: break-all;
                    margin-bottom: 24px;
                    width: 100%;
                }
                .ld-success-btn {
                    width: 100%;
                    padding: 16px;
                    border-radius: 16px;
                    background: rgba(0, 186, 124, 0.15);
                    color: #00ba7c;
                    border: none;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ld-success-btn:hover { background: rgba(0, 186, 124, 0.25); }
            `}</style>

            <div className="ld-icon-box">
                <Bug size={42} variant="Bold" />
            </div>

            <h2 className="ld-title">Создать отчет об ошибке?</h2>

            {status === 'idle' && (
                <>
                    <p className="ld-desc">
                        Мы соберем логи приложения и драйвера сети в один <b>ZIP-архив</b> и сохраним его на ваш <b>Рабочий стол</b> для передачи разработчику.
                    </p>
                    <div className="ld-actions">
                        <button className="ld-btn cancel" onClick={closeModal}>Отмена</button>
                        <button className="ld-btn confirm" onClick={handleDump}>Создать ZIP</button>
                    </div>
                </>
            )}

            {status === 'working' && (
                <div style={{ color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="modern-spinner" style={{ width: 36, height: 36, marginBottom: 16 }}>
                        <div className="inner-ring" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
                    </div>
                    <p style={{ fontWeight: 600 }}>Упаковка файлов логов...</p>
                </div>
            )}

            {status === 'success' && (
                <>
                    <p style={{ color: '#00ba7c', fontWeight: '700', fontSize: '16px', marginBottom: '12px' }}>Успешно сохранено!</p>
                    <div className="ld-path-box">
                        {path}
                    </div>
                    <button className="ld-success-btn" onClick={closeModal}>Отлично</button>
                </>
            )}

            {status === 'error' && (
                <>
                    <p style={{ color: '#f4212e', fontWeight: '700', fontSize: '16px', marginBottom: '24px' }}>Не удалось создать архив.</p>
                    <button className="ld-btn cancel" style={{ width: '100%' }} onClick={closeModal}>Закрыть</button>
                </>
            )}
        </div>
    );
};

export default LogDumpModal;