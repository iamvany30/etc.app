import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeLoader } from '../../../core/ThemeLoader';
import { IconInfo, IconCheck } from '../../icons/SettingsIcons'; 
import { 
    IconDownload, 
    IconTrash, 
    IconRefresh, 
    IconSearch, 
    IconPalette 
} from '../../icons/ThemeIcons';

const ThemeSettings = ({ setStatus }) => {
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTheme, setActiveTheme] = useState(localStorage.getItem('itd_current_theme_folder') || 'default');
    const [processingTheme, setProcessingTheme] = useState(null);
    const [tab, setTab] = useState('installed');
    const [searchQuery, setSearchQuery] = useState('');

    const loadThemes = useCallback(async () => {
        setIsLoading(true);
        setStatus({ type: '', msg: '' });
        
        try {
            if (!window.api) return;
            const remoteResult = await window.api.invoke('themes:fetch-remote');
            const localResult = await window.api.invoke('themes:get-local');

            let remoteList = Array.isArray(remoteResult) ? remoteResult : [];
            let localList = Array.isArray(localResult) ? localResult : [];

            const mergedThemes = remoteList.map(remote => {
                const local = localList.find(l => l.name === remote.name);
                 
                const hasCustomColors = remote.colors && (remote.colors.accent || remote.colors.background);
                
                return {
                    ...remote,
                    isInstalled: !!local,
                    localVersion: local?.version || null,
                    isUpdateAvailable: local && String(local.version) !== String(remote.version),
                    hasCustomColors: hasCustomColors
                };
            });

            localList.forEach(local => {
                if (!mergedThemes.some(t => t.name === local.name)) {
                    const hasCustomColors = local.colors && (local.colors.accent || local.colors.background);
                    mergedThemes.push({ ...local, isInstalled: true, isOrphaned: true, hasCustomColors });
                }
            });

            setThemes(mergedThemes);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Ошибка связи с сервером тем' });
        } finally {
            setIsLoading(false);
        }
    }, [setStatus]);

    useEffect(() => {
        loadThemes();
    }, [loadThemes]);

    const applyTheme = async (folderName) => {
        setProcessingTheme(folderName);
        setStatus({ type: '', msg: 'Применение оболочки...' });

        try {
            if (folderName === 'default') {
                localStorage.removeItem('itd_current_theme_folder');
            } else {
                localStorage.setItem('itd_current_theme_folder', folderName);
            }

             
            await ThemeLoader.init();

             
            window.dispatchEvent(new Event('settingsUpdate')); 
            window.dispatchEvent(new Event('content-refresh'));
            window.dispatchEvent(new Event('app-soft-reload'));

            setActiveTheme(folderName);
            setStatus({ type: 'success', msg: 'Оболочка успешно применена!' });

        } catch (e) {
            console.error("Theme apply error:", e);
            setStatus({ type: 'error', msg: 'Ошибка применения' });
            if (folderName !== 'default') {
                applyTheme('default');
            }
        } finally {
            setProcessingTheme(null);
        }
    };

    const handleDownload = async (theme) => {
        setProcessingTheme(theme.name);
        setStatus({ type: '', msg: `Загрузка: ${theme.name}...` });
        try {
            const res = await window.api.invoke('themes:download', theme);
            if (res && res.success) {
                await loadThemes();
                if (activeTheme === theme.folderName) {
                    await applyTheme(theme.folderName);
                }
                setStatus({ type: 'success', msg: 'Установлено' });
            } else {
                setStatus({ type: 'error', msg: res?.error || 'Ошибка загрузки' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Сбой сети' });
        }
        setProcessingTheme(null);
    };

    const handleDelete = async (theme) => {
        if (!window.confirm(`Удалить тему "${theme.name}" с диска?`)) return;
        setProcessingTheme(theme.name);
        if (activeTheme === theme.folderName) {
            await applyTheme('default');
        }
        await window.api.invoke('themes:delete', theme.folderName);
        await loadThemes();
        setProcessingTheme(null);
    };

    const filteredThemes = useMemo(() => {
        let result = themes;
        if (tab === 'installed') result = result.filter(t => t.isInstalled);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => (t.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
        }
        return result;
    }, [themes, tab, searchQuery]);

    return (
        <div className="settings-content theme-settings-container">
            <div style={{ padding: '0 24px', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button className={`theme-tab ${tab === 'installed' ? 'active' : ''}`} onClick={() => setTab('installed')}>Установленные</button>
                    <button className={`theme-tab ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>Каталог</button>
                </div>
                <div className="theme-search-bar">
                    <IconSearch />
                    <input placeholder="Найти тему..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>

            <div className="themes-list">
                {tab === 'installed' && !searchQuery && (
                    <div className={`theme-card ${activeTheme === 'default' ? 'active' : ''}`}>
                        <div className="theme-card-content" onClick={() => applyTheme('default')}>
                            <div className="theme-header">
                                <span className="theme-title">Стандартная (Default)</span>
                                {activeTheme === 'default' && <span className="badge-active"><IconCheck /></span>}
                            </div>
                            <p className="theme-desc">Оригинальный интерфейс итд.app</p>
                        </div>
                        <div className="theme-card-actions">
                            {activeTheme !== 'default' && <button className="theme-action-btn primary" onClick={() => applyTheme('default')}>Применить</button>}
                        </div>
                    </div>
                )}

                {isLoading ? <div className="loading-state">Загрузка списка...</div> : 
                 filteredThemes.length === 0 ? <div className="empty-state">Ничего не найдено</div> : 
                 filteredThemes.map(theme => (
                    <div key={theme.name} className={`theme-card ${activeTheme === theme.folderName ? 'active' : ''}`}>
                        <div className="theme-card-content" onClick={() => theme.isInstalled && applyTheme(theme.folderName)}>
                            <div className="theme-header">
                                <span className="theme-title">{theme.name}</span>
                                <div style={{display: 'flex', gap: 6}}>
                                      
                                    {theme.hasCustomColors && (
                                        <span className="badge-colors" title="Меняет цвета интерфейса">
                                            <IconPalette />
                                        </span>
                                    )}
                                    {activeTheme === theme.folderName && <span className="badge-active"><IconCheck /></span>}
                                    {theme.isUpdateAvailable && <span className="badge-update">Обновление</span>}
                                </div>
                            </div>
                            <p className="theme-desc">{theme.description || 'Нет описания'}</p>
                            <div className="theme-meta">
                                <span>v{theme.version}</span>
                                {theme.author && <span>by {theme.author}</span>}
                            </div>
                        </div>

                        <div className="theme-card-actions">
                            {processingTheme === theme.name ? (
                                <span style={{fontSize: 12, opacity: 0.7}}>Обработка...</span>
                            ) : (
                                <>
                                    {!theme.isInstalled ? (
                                        <button className="theme-action-btn primary" onClick={(e) => {e.stopPropagation(); handleDownload(theme)}}><IconDownload /> Скачать</button>
                                    ) : theme.isUpdateAvailable ? (
                                        <button className="theme-action-btn update" onClick={(e) => {e.stopPropagation(); handleDownload(theme)}}><IconRefresh /> Обновить</button>
                                    ) : activeTheme !== theme.folderName ? (
                                        <button className="theme-action-btn primary" onClick={(e) => {e.stopPropagation(); applyTheme(theme.folderName)}}>Применить</button>
                                    ) : (
                                        <span style={{fontSize: 12, color: 'var(--color-primary)', fontWeight: 'bold'}}>Активна</span>
                                    )}
                                    {theme.isInstalled && (
                                        <button className="theme-action-btn danger icon-only" onClick={(e) => {e.stopPropagation(); handleDelete(theme)}} title="Удалить"><IconTrash /></button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .theme-settings-container { display: flex; flex-direction: column; }
                .theme-tab { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; }
                .theme-tab.active { background: var(--color-text); color: var(--color-background); border-color: var(--color-text); }
                .theme-search-bar { display: flex; align-items: center; background: var(--color-input-bg); padding: 8px 12px; border-radius: 8px; border: 1px solid transparent; }
                .theme-search-bar:focus-within { border-color: var(--color-primary); background: var(--color-background); }
                .theme-search-bar input { background: transparent; border: none; outline: none; margin-left: 8px; width: 100%; color: var(--color-text); }
                .themes-list { display: flex; flex-direction: column; gap: 12px; padding: 0 24px; }
                .theme-card { background: var(--color-item-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s; }
                .theme-card.active { border-color: var(--color-primary); background: rgba(29, 155, 240, 0.05); }
                .theme-card-content { cursor: pointer; }
                .theme-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
                .theme-title { font-weight: 700; font-size: 15px; color: var(--color-text); }
                .theme-desc { font-size: 13px; color: var(--color-text-secondary); margin: 0; line-height: 1.4; }
                .theme-meta { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; display: flex; gap: 8px; }
                .theme-card-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--color-border-light); padding-top: 10px; }
                .theme-action-btn { padding: 6px 14px; border-radius: 99px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; }
                .theme-action-btn:hover { opacity: 0.8; }
                .theme-action-btn.primary { background: var(--color-text); color: var(--color-background); }
                .theme-action-btn.update { background: #ff9800; color: #000; }
                .theme-action-btn.danger { background: rgba(244, 33, 46, 0.1); color: #f4212e; }
                .theme-action-btn.icon-only { padding: 6px; border-radius: 8px; }
                .badge-active { color: var(--color-primary); display: flex; }
                .badge-update { font-size: 10px; font-weight: bold; background: #ff9800; color: black; padding: 2px 6px; border-radius: 4px; }
                .badge-colors { color: var(--color-text); background: var(--color-border); padding: 2px 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
                .loading-state, .empty-state { text-align: center; padding: 20px; color: var(--color-text-secondary); }
            `}</style>
        </div>
    );
};

export default ThemeSettings;