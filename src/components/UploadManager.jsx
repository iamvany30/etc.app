import React from 'react';
import { useUpload } from '../context/UploadContext';
import '../styles/UploadManager.css';

const getStatusInfo = (status) => {
    switch (status) {
        case 'starting': return { text: 'Подготовка...', p: 10 };
        case 'reading_tags': return { text: 'Обработка метаданных...', p: 25 };
        case 'uploading_audio': return { text: 'Загрузка аудио...', p: 50 };
        case 'uploading_cover': return { text: 'Загрузка обложки...', p: 75 };
        case 'creating_post': return { text: 'Создание поста...', p: 90 };
        case 'complete': return { text: 'Готово!', p: 100 };
        case 'error': return { text: 'Ошибка загрузки', p: 100 };
        default: return { text: 'Загрузка...', p: 0 };
    }
};

const UploadItem = ({ upload }) => {
    const info = getStatusInfo(upload.status);
    
    return (
        <div className={`upload-item ${upload.status}`}>
            <div className="upload-info">
                <span className="upload-filename" title={upload.fileName}>
                    {upload.fileName}
                </span>
                <span className="upload-status-text">{info.text}</span>
            </div>
            <div className="upload-progress-bar">
                <div 
                    className="upload-progress-fill" 
                    style={{ width: `${info.p}%` }} 
                />
            </div>
        </div>
    );
};

const UploadManager = () => {
    const { uploads } = useUpload();
    const activeUploads = Object.values(uploads);

    if (activeUploads.length === 0) return null;

    return (
        <div className="upload-manager-container">
            {activeUploads.map(upload => (
                <UploadItem key={upload.id} upload={upload} />
            ))}
        </div>
    );
};

export default UploadManager;