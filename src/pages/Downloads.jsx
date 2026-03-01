/* @source src/pages/Downloads.jsx */
import React, { useState, useEffect } from 'react';
import { useDownloadStore } from '../store/downloadStore';
import { useNavigate } from 'react-router-dom';
import ScrollArea from '../components/ScrollArea';
import { 
    AltArrowLeft, TrashBinTrash, Folder, MonitorSmartphone, Laptop, Archive, 
    MusicNotes, Gallery, VideoFrame, FileText, DownloadSquare, CloseCircle, PlayCircle
} from "@solar-icons/react";
import '../styles/Downloads.css';

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec) return '';
    return formatBytes(bytesPerSec) + '/с';
};

const FileIcon = ({ name }) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['exe', 'msi', 'bat'].includes(ext)) return <div className="file-icon-box" style={{color: '#0078D7', background: 'rgba(0,120,215,0.1)'}}><MonitorSmartphone size={24} variant="Bold" /></div>;
    if (['dmg', 'pkg', 'app'].includes(ext)) return <div className="file-icon-box" style={{color: '#ffffff', background: 'rgba(255,255,255,0.1)'}}><Laptop size={24} variant="Bold" /></div>;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <div className="file-icon-box" style={{color: '#ffad1f', background: 'rgba(255,173,31,0.1)'}}><Archive size={24} variant="Bold" /></div>;
    if (['mp3', 'wav', 'm4a', 'flac', 'ogg'].includes(ext)) return <div className="file-icon-box" style={{color: '#1d9bf0', background: 'rgba(29,155,240,0.1)'}}><MusicNotes size={24} variant="Bold" /></div>;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <div className="file-icon-box" style={{color: '#00ba7c', background: 'rgba(0,186,124,0.1)'}}><Gallery size={24} variant="Bold" /></div>;
    if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) return <div className="file-icon-box" style={{color: '#f91880', background: 'rgba(249,24,128,0.1)'}}><VideoFrame size={24} variant="Bold" /></div>;
    return <div className="file-icon-box" style={{color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.05)'}}><FileText size={24} variant="Bold" /></div>;
};

const ActiveDownloadItem = ({ item }) => {
    const cancelDownload = useDownloadStore(state => state.cancelDownload);
    const confirmDownload = useDownloadStore(state => state.confirmDownload);
    
    const isPaused = item.status === 'paused';
    const isIndeterminate = item.percent < 0;

    let statusText = '';
    if (isPaused) {
        statusText = 'Ожидание...';
    } else if (isIndeterminate) {
        statusText = `${formatBytes(item.receivedBytes)} (Размер неизвестен)`;
    } else {
        statusText = `${Math.round(item.percent)}% • ${formatBytes(item.receivedBytes)} из ${formatBytes(item.totalBytes)}`;
    }

    return (
        <div className={`download-row active ${isPaused ? 'paused' : ''}`}>
            <FileIcon name={item.fileName || 'file'} />
            <div className="dl-info">
                <div className="dl-name" title={item.fileName}>{item.fileName || 'Загрузка...'}</div>
                
                {isPaused ? (
                    <div className="dl-meta">
                        <span className="dl-status-text missing" style={{color: 'var(--color-primary)'}}>{statusText}</span>
                        <button className="dl-action-link" onClick={() => confirmDownload(item.id)} style={{marginLeft: 10}}>
                            <PlayCircle size={14} /> Скачать
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="dl-meta">
                            <span className="dl-status-text">{statusText}</span>
                            {item.speed > 0 && <span className="dl-speed-text">({formatSpeed(item.speed)})</span>}
                        </div>
                        <div className="dl-progress-track">
                            {isIndeterminate ? (
                                <div className="dl-progress-bar indeterminate" />
                            ) : (
                                <div className="dl-progress-bar" style={{ width: `${item.percent}%` }} />
                            )}
                        </div>
                    </>
                )}
            </div>
            
            <button className="dl-remove-btn" onClick={() => cancelDownload(item.id)} title="Отменить" style={{opacity: 1}}>
                <CloseCircle size={22} color="#f4212e" />
            </button>
        </div>
    );
};

const HistoryItem = ({ item, onRemove }) => {
    const [fileExists, setFileExists] = useState(true);
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed' || item.status === 'cancelled';

    useEffect(() => {
        let isMounted = true;
        const checkFile = async () => {
            if (isCompleted && item.path && window.api?.invoke) {
                try {
                    const exists = await window.api.invoke('fs:check-exists', item.path);
                    if (isMounted) setFileExists(exists);
                } catch (e) {
                    if (isMounted) setFileExists(false);
                }
            }
        };
        checkFile();
        return () => { isMounted = false; };
    }, [isCompleted, item.path]);

    const openFile = () => {
        if (isCompleted && fileExists && item.path) {
            window.api.invoke('fs:open-path', item.path);
        }
    };

    const showInFolder = (e) => {
        e.stopPropagation();
        if (isCompleted && fileExists && item.path) {
            window.api.invoke('fs:show-in-folder', item.path);
        }
    };

    return (
        <div className={`download-row ${!fileExists && isCompleted ? 'deleted-file' : ''}`} onClick={openFile}>
            <FileIcon name={item.fileName || 'file'} />
            <div className="dl-info">
                <div className="dl-name" title={item.path}>{item.fileName}</div>
                <div className="dl-meta">
                    {isCompleted && fileExists && <span className="dl-status-text success">{formatBytes(item.totalBytes)}</span>}
                    {isCompleted && !fileExists && <span className="dl-status-text missing">Файл удален</span>}
                    {isFailed && <span className="dl-status-text error">
                        {item.status === 'cancelled' ? 'Отменено' : 'Ошибка'}
                    </span>}
                    
                    {isCompleted && fileExists && (
                        <button className="dl-action-link" onClick={showInFolder}>
                            <Folder size={14} /> Папка
                        </button>
                    )}
                </div>
            </div>
            <button className="dl-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} title="Убрать из списка">
                <TrashBinTrash size={18} />
            </button>
        </div>
    );
};

const Downloads = () => {
    const navigate = useNavigate();
    const downloads = useDownloadStore(state => state.downloads);
    const history = useDownloadStore(state => state.history);
    const clearHistory = useDownloadStore(state => state.clearHistory);
    const removeItem = useDownloadStore(state => state.removeItem);

    const activeItems = Object.values(downloads);

    return (
        <div className="downloads-page">
            <header className="dl-sticky-header">
                <div className="dl-header-left">
                    <button className="dl-back-btn" onClick={() => navigate(-1)}>
                        <AltArrowLeft size={24} />
                    </button>
                    <h2 className="dl-header-title">Загрузки</h2>
                </div>
                {history.length > 0 && (
                    <button className="dl-clear-history-btn" onClick={clearHistory}>
                        Очистить
                    </button>
                )}
            </header>

            <ScrollArea className="downloads-content content-fade-in">
                {activeItems.length > 0 && (
                    <div className="downloads-section">
                        <h3 className="dl-section-title">Активные</h3>
                        <div className="downloads-list">
                            {activeItems.map((item) => (
                                <ActiveDownloadItem key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="downloads-section">
                        <h3 className="dl-section-title">История</h3>
                        <div className="downloads-list">
                            {history.map((item) => (
                                <HistoryItem key={item.id} item={item} onRemove={removeItem} />
                            ))}
                        </div>
                    </div>
                )}

                {activeItems.length === 0 && history.length === 0 && (
                    <div className="dl-empty-state">
                        <div className="dl-empty-icon">
                            <DownloadSquare size={48} />
                        </div>
                        <h3>История пуста</h3>
                        <p>Здесь будут отображаться скачанные вами файлы.</p>
                    </div>
                )}
                <div style={{ height: '140px' }} />
            </ScrollArea>
        </div>
    );
};

export default Downloads;