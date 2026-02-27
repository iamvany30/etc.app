/* @source src/components/modals/sections/MediaSettings.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { SettingsSkeleton } from '../../Skeletons';
import { useUserStore } from '../../../store/userStore';
import { useModalStore } from '../../../store/modalStore';
import ConfirmActionModal from '../ConfirmActionModal';
import { 
    TrashBinTrash, Gallery, VideoFrame, MusicNotes, FileText, CheckCircle, InfoCircle, User
} from "@solar-icons/react";
import { storage } from '../../../utils/storage';
import { historyUtils } from '../../../utils/historyUtils';

import '../../../styles/settings/Media.css';

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TIME_MARKS = [ { l: '3 дня', v: 3 }, { l: '1 нед', v: 7 }, { l: '1 мес', v: 30 }, { l: 'Всегда', v: 0 } ];
const SIZE_MARKS = [ { l: '500 МБ', v: 500 }, { l: '1 ГБ', v: 1024 }, { l: '5 ГБ', v: 5120 }, { l: 'Безлимит', v: 0 } ];
const HISTORY_LIMITS = [ { l: '100', v: 100 }, { l: '250', v: 250 }, { l: '500', v: 500 }, { l: '1000', v: 1000 } ];

const MediaSettings = ({ setStatus, reopenModal }) => {
    const accounts = useUserStore(state => state.accounts);
    const openModal = useModalStore(state => state.openModal);
    
    const [loading, setLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    
    const [compress, setCompress] = useState(true);
    const [appGpu, setAppGpu] = useState(true);

    const [stats, setStats] = useState({ images: 0, videos: 0, audio: 0, other: 0, idb: 0, total: 0 });
    const [accountSizes, setAccountSizes] = useState({});
    
    const [timeIndex, setTimeIndex] = useState(2); 
    const [sizeIndex, setSizeIndex] = useState(1); 
    const [historyIndex, setHistoryIndex] = useState(0);

    const [clearOptions, setClearOptions] = useState({ 
        images: false, videos: false, audio: false, otherBrowserData: false 
    });
    const [selectedAccounts, setSelectedAccounts] = useState({});

    const loadData = async () => {
        setCompress(localStorage.getItem('itd_compress_files') !== 'false');
        
        const currentLimit = historyUtils.getLimit();
        const hIdx = HISTORY_LIMITS.findIndex(m => m.v === currentLimit);
        setHistoryIndex(hIdx >= 0 ? hIdx : 0);

        if (window.api?.invoke) {
            try {
                const isHwAccel = await window.api.invoke('app:get-hardware-acceleration');
                setAppGpu(isHwAccel);
                
                const cacheData = await window.api.cache.getStats();
                
                const prefixes = {};
                accounts.forEach(acc => prefixes[acc.id] = `unified_v2_${acc.id}_`);
                
                const sizes = await storage.estimateSizes(prefixes);
                setAccountSizes(sizes);
                
                const totalIdb = Object.values(sizes).reduce((acc, val) => acc + val, 0);

                const initialSelected = {};
                accounts.forEach(acc => initialSelected[acc.id] = true);
                setSelectedAccounts(initialSelected);
                
                setStats({ 
                    images: cacheData.images, 
                    videos: cacheData.videos, 
                    audio: cacheData.audio, 
                    other: cacheData.other, 
                    idb: totalIdb,
                    total: cacheData.total + totalIdb 
                });

                const savedTime = parseInt(localStorage.getItem('itd_cache_time') || '30');
                const savedSize = parseInt(localStorage.getItem('itd_cache_size') || '2048');
                
                const tIdx = TIME_MARKS.findIndex(m => m.v === savedTime);
                setTimeIndex(tIdx >= 0 ? tIdx : 2);
                
                const sIdx = SIZE_MARKS.findIndex(m => m.v === savedSize);
                setSizeIndex(sIdx >= 0 ? sIdx : 1);
                
            } catch (e) { console.warn(e); }
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleLimitChange = async (type, idx) => {
        let newTime = TIME_MARKS[timeIndex].v;
        let newSize = SIZE_MARKS[sizeIndex].v;

        if (type === 'time') {
            setTimeIndex(idx);
            newTime = TIME_MARKS[idx].v;
            localStorage.setItem('itd_cache_time', newTime);
        } else {
            setSizeIndex(idx);
            newSize = SIZE_MARKS[idx].v;
            localStorage.setItem('itd_cache_size', newSize);
        }

        if (window.api?.cache) {
            await window.api.cache.updateLimits({ maxAgeDays: newTime, maxSizeMB: newSize });
        }
    };

    const handleHistoryLimitChange = (idx) => {
        setHistoryIndex(idx);
        historyUtils.setLimit(HISTORY_LIMITS[idx].v);
    };

    const execClear = async () => {
        setIsClearing('processing');
        setStatus({ type: '', msg: 'Очистка...' });

        try {
            await window.api.cache.clear({
                images: clearOptions.images,
                videos: clearOptions.videos,
                audio: clearOptions.audio,
                other: clearOptions.otherBrowserData 
            });

            if (clearOptions.otherBrowserData) {
                await window.api.invoke('debug:clear-electron-cache'); 
            }
            
            for (const [accId, isSelected] of Object.entries(selectedAccounts)) {
                if (isSelected) {
                    await storage.clearPrefix(`unified_v2_${accId}_`);
                }
            }
            
            if (clearOptions.otherBrowserData) {
                await storage.clearPrefix('unified_v2_guest_');
                await storage.clearPrefix('unified_v2_feed'); 
            }
            
            setStatus({ type: 'success', msg: 'Кэш успешно очищен!' });
            setIsClearing(false);
            
            setClearOptions({ images: false, videos: false, audio: false, otherBrowserData: false });
            
            await loadData();
        } catch (e) {
            setStatus({ type: 'error', msg: 'Произошла ошибка при очистке' });
            setIsClearing(false);
        }
    };

    const toggleAppGpu = () => {
        openModal(
            <ConfirmActionModal 
                title="Требуется перезапуск"
                message="Для изменения настроек аппаратного ускорения необходимо перезапустить приложение. Продолжить?"
                confirmText="Перезапустить"
                onConfirm={async () => {
                    await window.api.invoke('app:toggle-hardware-acceleration', !appGpu);
                }}
                onCancel={reopenModal}
            />
        );
    };
    
    const isAnySelectedForClear = useMemo(() => {
        return clearOptions.images || clearOptions.videos || clearOptions.audio || clearOptions.otherBrowserData || Object.values(selectedAccounts).some(v => v);
    }, [clearOptions, selectedAccounts]);

    if (loading) return <SettingsSkeleton count={5} />;

    const totalCalc = stats.total || 1; 
    const pImg = (stats.images / totalCalc) * 100;
    const pVid = (stats.videos / totalCalc) * 100;
    const pAud = (stats.audio / totalCalc) * 100;
    const pData = ((stats.other + stats.idb) / totalCalc) * 100;

    return (
        <div className="settings-content cache-settings">
            
            {isClearing !== true && isClearing !== 'processing' ? (
                <>
                    <div className="cache-hero-section">
                        <div className="cache-hero-header">
                            <span className="cache-subtitle">Занято на устройстве</span>
                            <h2 className="cache-title">{formatBytes(stats.total)}</h2>
                        </div>
                        
                        <div className={`cache-progress-bar ${stats.total === 0 ? 'empty' : ''}`}>
                            {stats.total > 0 && (
                                <>
                                    <div className="cp-segment img" style={{width: `${pImg}%`}}/>
                                    <div className="cp-segment vid" style={{width: `${pVid}%`}}/>
                                    <div className="cp-segment aud" style={{width: `${pAud}%`}}/>
                                    <div className="cp-segment oth" style={{width: `${pData}%`}}/>
                                </>
                            )}
                        </div>

                        <div className="cache-legend-grid">
                            <div className="cl-item"><span className="cl-dot img"/>Фото ({formatBytes(stats.images)})</div>
                            <div className="cl-item"><span className="cl-dot vid"/>Видео ({formatBytes(stats.videos)})</div>
                            <div className="cl-item"><span className="cl-dot aud"/>Музыка ({formatBytes(stats.audio)})</div>
                            <div className="cl-item"><span className="cl-dot oth"/>Данные ({formatBytes(stats.other + stats.idb)})</div>
                        </div>

                        <button className="settings-save-btn" onClick={() => setIsClearing(true)}>
                            <TrashBinTrash size={20}/> Управление местом
                        </button>
                    </div>

                    <div className="settings-section-title">Автоматическая очистка</div>
                    
                    <div className="settings-option column-option">
                        <div className="slider-header">
                            <span className="settings-option-name">Хранить медиа</span>
                            <span className="slider-value-label">{TIME_MARKS[timeIndex].l}</span>
                        </div>
                        <input type="range" className="tg-slider" min="0" max="3" value={timeIndex} onChange={(e)=>handleLimitChange('time', parseInt(e.target.value))} />
                        <div className="tg-slider-marks">
                            {TIME_MARKS.map((m,i) => <span key={i} className={timeIndex===i?'active':''}>{m.l}</span>)}
                        </div>
                    </div>

                    <div className="settings-option column-option">
                        <div className="slider-header">
                            <span className="settings-option-name">Максимальный размер</span>
                            <span className="slider-value-label">{SIZE_MARKS[sizeIndex].l}</span>
                        </div>
                        <input type="range" className="tg-slider" min="0" max="3" value={sizeIndex} onChange={(e)=>handleLimitChange('size', parseInt(e.target.value))} />
                        <div className="tg-slider-marks">
                            {SIZE_MARKS.map((m,i) => <span key={i} className={sizeIndex===i?'active':''}>{m.l}</span>)}
                        </div>
                    </div>

                    <div className="settings-option column-option">
                        <div className="slider-header">
                            <span className="settings-option-name">Лимит недавних постов</span>
                            <span className="slider-value-label">{HISTORY_LIMITS[historyIndex].l} шт.</span>
                        </div>
                        <input type="range" className="tg-slider" min="0" max="3" value={historyIndex} onChange={(e)=>handleHistoryLimitChange(parseInt(e.target.value))} />
                        <div className="tg-slider-marks">
                            {HISTORY_LIMITS.map((m,i) => <span key={i} className={historyIndex===i?'active':''}>{m.l}</span>)}
                        </div>
                    </div>

                    <div className="settings-section-title">Система</div>
                    
                    <div className="settings-option" onClick={toggleAppGpu}>
                        <div className="settings-option-info">
                            <span className="settings-option-name">Аппаратное ускорение (GPU)</span>
                            <span className="settings-option-desc">{appGpu ? "Включено" : "Выключено (Использовать при глитчах видео)"}</span>
                        </div>
                        <button className={`toggle-switch ${appGpu ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                    </div>

                    <div className="settings-option" onClick={() => {
                        const n = !compress; setCompress(n); localStorage.setItem('itd_compress_files', n);
                    }}>
                        <div className="settings-option-info">
                            <span className="settings-option-name">Сжатие при загрузке</span>
                            <span className="settings-option-desc">Оптимизировать фото и видео перед отправкой</span>
                        </div>
                        <button className={`toggle-switch ${compress ? 'active' : ''}`}><span className="toggle-thumb" /></button>
                    </div>
                </>
            ) : (
                <div className="cache-clear-mode animation-fade">
                    <div className="settings-section-title">Медиафайлы (Общие)</div>
                    
                    <div className="clear-check-list">
                        <label className="clear-check-item">
                            <div className="cci-left">
                                <Gallery className="cci-icon" color="#1d9bf0" />
                                <div>
                                    <div className="cci-name">Изображения</div>
                                    <div className="cci-size">{formatBytes(stats.images)}</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={clearOptions.images} onChange={(e)=>setClearOptions({...clearOptions, images: e.target.checked})} disabled={isClearing === 'processing'} />
                            <div className="cci-checkbox"><CheckCircle variant="Bold"/></div>
                        </label>
                        
                        <label className="clear-check-item">
                            <div className="cci-left">
                                <VideoFrame className="cci-icon" color="#00ba7c" />
                                <div>
                                    <div className="cci-name">Видеофайлы</div>
                                    <div className="cci-size">{formatBytes(stats.videos)}</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={clearOptions.videos} onChange={(e)=>setClearOptions({...clearOptions, videos: e.target.checked})} disabled={isClearing === 'processing'} />
                            <div className="cci-checkbox"><CheckCircle variant="Bold"/></div>
                        </label>
                        
                        <label className="clear-check-item">
                            <div className="cci-left">
                                <MusicNotes className="cci-icon" color="#ffad1f" />
                                <div>
                                    <div className="cci-name">Музыка и аудио</div>
                                    <div className="cci-size">{formatBytes(stats.audio)}</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={clearOptions.audio} onChange={(e)=>setClearOptions({...clearOptions, audio: e.target.checked})} disabled={isClearing === 'processing'} />
                            <div className="cci-checkbox"><CheckCircle variant="Bold"/></div>
                        </label>
                    </div>

                    <div className="settings-section-title settings-margin-top">Данные профилей (Лента, Сохраненное)</div>
                    
                    <div className="clear-check-list">
                        {accounts.map(acc => (
                            <label key={acc.id} className="clear-check-item">
                                <div className="cci-left">
                                    <div className="cci-icon avatar-icon">
                                        {acc.avatar && acc.avatar.length > 5 ? (
                                            <img src={acc.avatar} alt="" className="cci-avatar-img" />
                                        ) : (
                                            <User className="cci-fallback-icon" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="cci-name">@{acc.username}</div>
                                        <div className="cci-size">{formatBytes(accountSizes[acc.id] || 0)}</div>
                                    </div>
                                </div>
                                <input type="checkbox" checked={!!selectedAccounts[acc.id]} onChange={(e)=>setSelectedAccounts({...selectedAccounts, [acc.id]: e.target.checked})} disabled={isClearing === 'processing'} />
                                <div className="cci-checkbox"><CheckCircle variant="Bold"/></div>
                            </label>
                        ))}

                        <label className="clear-check-item">
                            <div className="cci-left">
                                <FileText className="cci-icon" color="#8899a6" />
                                <div>
                                    <div className="cci-name">Прочие данные (Chromium, Гость)</div>
                                    <div className="cci-size">{formatBytes(stats.other + (accountSizes['other'] || 0))}</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={clearOptions.otherBrowserData} onChange={(e)=>setClearOptions({...clearOptions, otherBrowserData: e.target.checked})} disabled={isClearing === 'processing'} />
                            <div className="cci-checkbox"><CheckCircle variant="Bold"/></div>
                        </label>
                    </div>

                    {clearOptions.otherBrowserData && (
                        <div className="clear-warning-box">
                            <InfoCircle size={20} />
                            <span>Очистка прочих данных удалит кэш Chromium (служебные файлы). Ваши сессии и черновики сохранятся.</span>
                        </div>
                    )}

                    <div className="modal-actions settings-margin-top">
                        <button className="settings-save-btn secondary" onClick={()=>setIsClearing(false)} disabled={isClearing === 'processing'}>
                            Отмена
                        </button>
                        <button 
                            className="settings-save-btn" 
                            style={{ background: isAnySelectedForClear ? 'var(--dev-danger)' : 'var(--color-border)', color: isAnySelectedForClear ? '#fff' : 'var(--color-text-muted)' }} 
                            onClick={execClear} 
                            disabled={isClearing === 'processing' || !isAnySelectedForClear}
                        >
                            {isClearing === 'processing' ? 'Удаление...' : 'Очистить выбранное'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaSettings;