/* @source src/components/modals/sections/MediaSettings.jsx */
import React, { useState, useEffect } from 'react';
import { SettingsSkeleton } from '../../Skeletons';

const MediaSettings = () => {
    const [loading, setLoading] = useState(true);
    const [compress, setCompress] = useState(true);
    const [gpu, setGpu] = useState(true);
    const [internalBrowser, setInternalBrowser] = useState(true);
    const [askDownload, setAskDownload] = useState(true);

    useEffect(() => {
        setCompress(localStorage.getItem('itd_compress_files') !== 'false');
        setGpu(localStorage.getItem('itd_use_gpu') === 'true');
        setInternalBrowser(localStorage.getItem('itd_use_internal_browser') === 'true');
        setAskDownload(localStorage.getItem('itd_ask_download') !== 'false'); 
        setLoading(false);
    }, []);

    const toggle = (key, val, setVal) => {
        const next = !val;
        setVal(next);
        localStorage.setItem(key, String(next));
    };

    if (loading) return <SettingsSkeleton count={3} />;

    return (
        <div className="settings-content">
            <div className="settings-option" onClick={() => toggle('itd_use_internal_browser', internalBrowser, setInternalBrowser)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Встроенный браузер</span>
                    <span className="settings-option-desc">Открывать внешние ссылки внутри приложения</span>
                </div>
                <button className={`toggle-switch ${internalBrowser ? 'active' : ''}`}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            <div className="settings-option" onClick={() => toggle('itd_ask_download', askDownload, setAskDownload)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Подтверждать загрузку</span>
                    <span className="settings-option-desc">Спрашивать разрешение перед скачиванием файлов</span>
                </div>
                <button className={`toggle-switch ${askDownload ? 'active' : ''}`}>
                    <span className="toggle-thumb" />
                </button>
            </div>

            <div className="settings-option" onClick={() => toggle('itd_compress_files', compress, setCompress)}>
                <div className="settings-option-info">
                    <span className="settings-option-name">Сжатие медиа</span>
                    <span className="settings-option-desc">Уменьшать размер фото/видео перед отправкой</span>
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