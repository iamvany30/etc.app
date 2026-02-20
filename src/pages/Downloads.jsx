import React from 'react';
import { useDownload } from '../context/DownloadContext';
import { NavBackIcon, TrashIcon } from '../components/icons/CommonIcons';
import { IconDownload } from '../components/icons/ThemeIcons';
import { useNavigate } from 'react-router-dom';
import '../styles/Downloads.css'; 

const FileIcon = ({ name }) => {
    const ext = name.split('.').pop().toLowerCase();
    let color = '#8899a6';
    let label = 'FILE';

    if (['mp3', 'wav', 'm4a'].includes(ext)) { color = '#1d9bf0'; label = '♫'; }
    else if (['jpg', 'png', 'gif', 'webp'].includes(ext)) { color = '#00ba7c'; label = 'IMG'; }
    else if (['mp4', 'mov', 'webm'].includes(ext)) { color = '#f91880'; label = 'VID'; }
    else if (['zip', 'rar', 'exe'].includes(ext)) { color = '#ffad1f'; label = 'ZIP'; }

    return (
        <div className="file-icon-box" style={{ borderColor: color, color: color }}>
            {label}
        </div>
    );
};

const DownloadItem = ({ item, onRemove }) => {
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed' || item.status === 'cancelled';
    const isActive = item.status === 'progressing' || item.status === 'starting';

    const openFile = () => {
        if (isCompleted && item.path) window.api.invoke('fs:open-path', item.path);
    };

    const showInFolder = (e) => {
        e.stopPropagation();
        if (item.path) window.api.invoke('fs:show-in-folder', item.path);
    };

    return (
        <div className={`download-row ${isActive ? 'active' : ''}`} onClick={openFile}>
            <FileIcon name={item.fileName || 'file'} />
            
            <div className="dl-info">
                <div className="dl-name" title={item.path}>{item.fileName || 'Загрузка...'}</div>
                <div className="dl-meta">
                    {isActive && <span className="dl-status-text">Загрузка... {Math.round(item.percent)}%</span>}
                    {isCompleted && <span className="dl-status-text success">Загружено</span>}
                    {isFailed && <span className="dl-status-text error">Ошибка</span>}
                    
                    {isCompleted && (
                        <button className="dl-action-link" onClick={showInFolder}>
                            Показать в папке
                        </button>
                    )}
                </div>
                {isActive && (
                    <div className="dl-progress-track">
                        <div className="dl-progress-bar" style={{ width: `${item.percent}%` }} />
                    </div>
                )}
            </div>

            <button 
                className="dl-remove-btn" 
                onClick={(e) => { e.stopPropagation(); onRemove(item.startTime); }}
                title="Убрать из списка"
            >
                <TrashIcon size={18} />
            </button>
        </div>
    );
};

const Downloads = () => {
    const navigate = useNavigate();
    const { history, clearHistory, removeItem } = useDownload();

    return (
        <div className="downloads-page">
            <header className="sticky-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <NavBackIcon />
                    </button>
                    <h2 className="header-title">Загрузки</h2>
                </div>
                {history.length > 0 && (
                    <button className="clear-history-btn" onClick={clearHistory}>
                        Очистить всё
                    </button>
                )}
            </header>

            <div className="downloads-content">
                {history.length === 0 ? (
                    <div className="empty-downloads">
                        <div className="empty-icon-circle">
                            <IconDownload size={40} />
                        </div>
                        <h3>История пуста</h3>
                        <p>Здесь появятся скачанные файлы</p>
                    </div>
                ) : (
                    <div className="downloads-list">
                        {history.map((item, idx) => (
                            <DownloadItem key={item.startTime || idx} item={item} onRemove={removeItem} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Downloads;