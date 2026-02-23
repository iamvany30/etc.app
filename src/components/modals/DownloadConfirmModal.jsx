/* @source src/components/modals/DownloadConfirmModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useDownloadStore } from '../../store/downloadStore';
import { useModalStore } from '../../store/modalStore';
import { 
    DownloadSquare, 
    MonitorSmartphone, 
    Laptop, 
    Archive, 
    MusicNotes, 
    Gallery, 
    VideoFrame, 
    FileText,
    CheckSquare
} from "@solar-icons/react";

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return 'Неизвестный размер';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FileIconLarge = ({ name }) => {
    const ext = name?.split('.').pop().toLowerCase() || '';
    let icon = <FileText size={42} variant="Bold" />;
    let gradient = 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
    let color = 'var(--color-text-secondary)';

    if (['exe', 'msi', 'bat'].includes(ext)) {
        icon = <MonitorSmartphone size={42} variant="Bold" />;
        gradient = 'linear-gradient(135deg, rgba(0, 120, 215, 0.2), rgba(0, 120, 215, 0.05))';
        color = '#0078D7';
    } else if (['dmg', 'pkg', 'app'].includes(ext)) {
        icon = <Laptop size={42} variant="Bold" />;
        gradient = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))';
        color = '#ffffff';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        icon = <Archive size={42} variant="Bold" />;
        gradient = 'linear-gradient(135deg, rgba(255, 173, 31, 0.2), rgba(255, 173, 31, 0.05))';
        color = '#ffad1f';
    } else if (['mp3', 'wav', 'm4a', 'flac'].includes(ext)) {
        icon = <MusicNotes size={42} variant="Bold" />;
        gradient = 'linear-gradient(135deg, rgba(29, 155, 240, 0.2), rgba(29, 155, 240, 0.05))';
        color = '#1d9bf0';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        icon = <Gallery size={42} variant="Bold" />;
        gradient = 'linear-gradient(135deg, rgba(0, 186, 124, 0.2), rgba(0, 186, 124, 0.05))';
        color = '#00ba7c';
    } else if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) {
        icon = <VideoFrame size={42} variant="Bold" />;
        gradient = 'linear-gradient(135deg, rgba(249, 24, 128, 0.2), rgba(249, 24, 128, 0.05))';
        color = '#f91880';
    }

    return (
        <div className="dm-file-icon" style={{
            background: gradient,
            color: color,
            boxShadow: `0 12px 40px ${color}20`, 
            borderColor: `${color}30`
        }}>
            {icon}
        </div>
    );
};

const DownloadConfirmModal = ({ downloadItem }) => {
    const confirmDownload = useDownloadStore(state => state.confirmDownload);
    const cancelDownload = useDownloadStore(state => state.cancelDownload);
    const closeModal = useModalStore(state => state.closeModal);
    
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const actionTakenRef = useRef(false);

    useEffect(() => {
        return () => {
            if (!actionTakenRef.current) {
                const currentItemState = useDownloadStore.getState().downloads[downloadItem.id];
                if (currentItemState && currentItemState.status === 'paused') {
                    useDownloadStore.getState().cancelDownload(downloadItem.id);
                }
            }
        };
    }, [downloadItem.id]);

    const handleConfirm = () => {
        actionTakenRef.current = true;
        if (dontAskAgain) {
            localStorage.setItem('itd_ask_download', 'false');
        }
        confirmDownload(downloadItem.id);
        closeModal();
    };

    const handleCancel = () => {
        actionTakenRef.current = true;
        cancelDownload(downloadItem.id);
        closeModal();
    };

    const displaySize = formatBytes(downloadItem.totalBytes);

    return (
        <div className="download-modal-container">
            <style>{`
                .download-modal-container { 
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
                .dm-file-icon {
                    width: 88px;
                    height: 88px;
                    border-radius: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                    border: 1px solid;
                }
                .dm-title { 
                    font-size: 22px; 
                    font-weight: 800; 
                    margin: 0 0 12px 0; 
                    color: var(--color-text); 
                    letter-spacing: -0.5px;
                }
                .dm-file-card { 
                    background: rgba(255, 255, 255, 0.03); 
                    border: 1px solid var(--color-border); 
                    border-radius: 16px; 
                    padding: 16px; 
                    width: 100%; 
                    margin-bottom: 24px; 
                    text-align: center; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center;
                    gap: 6px; 
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
                }
                [data-bg='light'] .dm-file-card {
                    background: rgba(0, 0, 0, 0.02);
                }
                .dm-filename { 
                    font-size: 15px; 
                    font-weight: 700; 
                    color: var(--color-text); 
                    word-break: break-all; 
                    line-height: 1.4; 
                }
                .dm-filesize { 
                    font-size: 13px; 
                    color: var(--color-text-secondary); 
                    font-weight: 500; 
                }
                .dm-checkbox-label { 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    font-size: 13px; 
                    color: var(--color-text-secondary); 
                    margin-bottom: 28px; 
                    cursor: pointer; 
                    user-select: none; 
                    transition: color 0.2s; 
                }
                .dm-checkbox-label:hover { 
                    color: var(--color-text); 
                }
                .dm-custom-checkbox { 
                    width: 22px; 
                    height: 22px; 
                    border-radius: 7px; 
                    border: 2px solid var(--color-border); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    transition: all 0.2s; 
                    color: transparent; 
                }
                .dm-checkbox-label input:checked + .dm-custom-checkbox { 
                    background: var(--color-primary); 
                    border-color: var(--color-primary); 
                    color: white; 
                }
                .dm-actions { 
                    display: flex; 
                    gap: 12px; 
                    width: 100%; 
                }
                .dm-btn { 
                    flex: 1; 
                    padding: 16px; 
                    border-radius: 16px; 
                    font-size: 15px; 
                    font-weight: 700; 
                    cursor: pointer; 
                    transition: transform 0.1s, opacity 0.2s, background-color 0.2s, box-shadow 0.2s; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 10px; 
                    border: none; 
                }
                .dm-btn:active { transform: scale(0.96); }
                .dm-btn.cancel { 
                    background: transparent; 
                    border: 1px solid var(--color-border); 
                    color: var(--color-text); 
                }
                .dm-btn.cancel:hover { 
                    background: var(--color-item-bg); 
                }
                .dm-btn.confirm { 
                    background: var(--color-text); 
                    color: var(--color-background); 
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
                }
                .dm-btn.confirm:hover { 
                    opacity: 0.9; 
                    transform: translateY(-2px);
                }
                .dm-btn.confirm:active {
                    transform: translateY(0) scale(0.96);
                }
            `}</style>

            <FileIconLarge name={downloadItem.fileName} />
            
            <h2 className="dm-title">Скачать этот файл?</h2>
            
            <div className="dm-file-card">
                <span className="dm-filename">{downloadItem.fileName}</span>
                <span className="dm-filesize">
                    {displaySize} • Сохранится в "Загрузки"
                </span>
            </div>

            <label className="dm-checkbox-label">
                <input 
                    type="checkbox" 
                    checked={dontAskAgain} 
                    onChange={e => setDontAskAgain(e.target.checked)} 
                    hidden
                />
                <div className="dm-custom-checkbox">
                    <CheckSquare size={16} variant="Bold" />
                </div>
                <span>Запомнить выбор и больше не спрашивать</span>
            </label>

            <div className="dm-actions">
                <button className="dm-btn cancel" onClick={handleCancel}>Отмена</button>
                <button className="dm-btn confirm" onClick={handleConfirm}>
                    <DownloadSquare size={22} variant="Bold" /> Скачать
                </button>
            </div>
        </div>
    );
};

export default DownloadConfirmModal;