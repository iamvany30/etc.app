import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';

const LogDumpModal = () => {
    const { closeModal } = useModal();
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
        <div style={{ padding: '32px', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ 
                width: '64px', height: '64px', borderRadius: '20px', 
                background: 'rgba(255, 255, 255, 0.05)', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-primary)', fontSize: '32px'
            }}>
                🐞
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>
                Создать отчет об ошибке?
            </h2>

            {status === 'idle' && (
                <>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
                        Мы соберем логи приложения и драйвера авторизации в один <b>ZIP-архив</b> и сохраним его на <b>Рабочем столе</b>.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={closeModal}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleDump}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--color-text)', border: 'none', color: 'var(--color-background)', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Создать ZIP
                        </button>
                    </div>
                </>
            )}

            {status === 'working' && (
                <div style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="modern-spinner" style={{width: 30, height: 30, marginBottom: 15}}>
                        <div className="inner-ring"></div>
                    </div>
                    <p>Упаковка файлов...</p>
                </div>
            )}

            {status === 'success' && (
                <>
                    <p style={{ color: '#00ba7c', fontWeight: '600', marginBottom: '8px' }}>Готово!</p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px', wordBreak: 'break-all' }}>
                        Файл сохранен: <br/>{path}
                    </p>
                    <button 
                        onClick={closeModal}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0, 186, 124, 0.15)', color: '#00ba7c', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Отлично
                    </button>
                </>
            )}

            {status === 'error' && (
                <>
                    <p style={{ color: '#f4212e', marginBottom: '20px' }}>Не удалось создать архив.</p>
                    <button onClick={closeModal} style={{ width: '100%', padding: '12px' }}>Закрыть</button>
                </>
            )}
        </div>
    );
};

export default LogDumpModal;