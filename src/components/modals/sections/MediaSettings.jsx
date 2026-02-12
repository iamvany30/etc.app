import React, { useState } from 'react';

const MediaSettings = () => {
    const [compress, setCompress] = useState(localStorage.getItem('itd_compress_files') !== 'false');
    const [gpu, setGpu] = useState(localStorage.getItem('itd_use_gpu') === 'true');

    const toggle = (key, val, setVal) => {
        const next = !val;
        setVal(next);
        localStorage.setItem(key, next);
    };

    return (
        <div className="settings-content">
            <div className="settings-option" onClick={() => toggle('itd_compress_files', compress, setCompress)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Сжатие медиа</span>
                    <span className="settings-option-desc">Уменьшать размер фото перед отправкой</span>
                </div>
                <button className={`toggle-switch ${compress ? 'active' : ''}`}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            <div className="settings-option" onClick={() => toggle('itd_use_gpu', gpu, setGpu)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Аппаратное ускорение</span>
                    <span className="settings-option-desc">Использовать GPU для обработки видео</span>
                </div>
                <button className={`toggle-switch ${gpu ? 'active' : ''}`}>
                    <span className="toggle-thumb" />
                </button>
            </div>
        </div>
    );
};

export default MediaSettings;