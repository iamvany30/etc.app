import React, { useState, useEffect, useCallback } from 'react';

const ThemeSettings = ({ setStatus }) => {
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTheme, setActiveTheme] = useState(localStorage.getItem('itd_current_theme_folder') || 'default');
    const [processingTheme, setProcessingTheme] = useState(null);

     
    const extractErrorMessage = (err) => {
        if (!err) return 'Неизвестная ошибка';
        if (typeof err === 'string') return err;
        if (err.message) return err.message;
        if (err.error) return typeof err.error === 'string' ? err.error : (err.error.message || JSON.stringify(err.error));
        return JSON.stringify(err);
    };

    const loadThemes = useCallback(async () => {
        setIsLoading(true);
        setStatus({ type: '', msg: '' });
        
        try {
             
            const remoteResult = await window.api.invoke('themes:fetch-remote');
            const localResult = await window.api.invoke('themes:get-local');

            let remoteList = [];
            let localList = [];

            if (Array.isArray(remoteResult)) {
                remoteList = remoteResult;
            } else if (remoteResult && remoteResult.error) {
                setStatus({ type: 'error', msg: `GitHub: ${extractErrorMessage(remoteResult.error)}` });
            }

            if (Array.isArray(localResult)) {
                localList = localResult;
            }

            const mergedThemes = remoteList.map(remote => {
                const local = localList.find(l => l.name === remote.name);
                return {
                    ...remote,
                    isInstalled: !!local,
                    localVersion: local?.version || null,
                    isUpdateAvailable: local && String(local.version) !== String(remote.version)
                };
            });

            localList.forEach(local => {
                if (!mergedThemes.some(t => t.name === local.name)) {
                    mergedThemes.push({ ...local, isInstalled: true, isOrphaned: true });
                }
            });

            setThemes(mergedThemes);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Ошибка связи с системным модулем' });
        } finally {
            setIsLoading(false);
        }
    }, [setStatus]);

    useEffect(() => {
        loadThemes();
    }, [loadThemes]);
    
    const applyTheme = async (folderName) => {
        if (folderName === 'default') {
            const styleTag = document.getElementById('dynamic-theme-style');
            if (styleTag) styleTag.textContent = '';
            localStorage.removeItem('itd_current_theme_folder');
            setActiveTheme('default');
            return;
        }
        
        try {
            const res = await window.api.invoke('themes:read-content', folderName);
            if (res && res.content) {
                let styleTag = document.getElementById('dynamic-theme-style');
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = 'dynamic-theme-style';
                    document.head.appendChild(styleTag);
                }
                styleTag.textContent = res.content;
                localStorage.setItem('itd_current_theme_folder', folderName);
                setActiveTheme(folderName);
            } else {
                setStatus({ type: 'error', msg: extractErrorMessage(res) });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Не удалось применить файл темы' });
        }
    };

    const handleDownload = async (theme) => {
        setProcessingTheme(theme.name);
        try {
            const res = await window.api.invoke('themes:download', theme);
            if (res && res.success) {
                await loadThemes();
                if (activeTheme === theme.folderName) {
                    await applyTheme(theme.folderName);
                }
            } else {
                setStatus({ type: 'error', msg: extractErrorMessage(res) });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка при скачивании' });
        }
        setProcessingTheme(null);
    };

    const handleDelete = async (theme) => {
        if (window.confirm(`Вы уверены, что хотите удалить тему "${theme.name}"?`)) {
            setProcessingTheme(theme.name);
            if (activeTheme === theme.folderName) {
                await applyTheme('default');
            }
            await window.api.invoke('themes:delete', theme.folderName);
            await loadThemes();
            setProcessingTheme(null);
        }
    };

    return (
        <div className="settings-content theme-settings">
            <div className={`theme-item ${activeTheme === 'default' ? 'active-row' : ''}`} onClick={() => applyTheme('default')}>
                <div className="theme-info">
                    <span className="theme-name">Стандартная тема</span>
                    <span className="theme-desc">Оригинальный вид итд.app</span>
                </div>
                {activeTheme === 'default' && <span className="theme-status active">Активна</span>}
            </div>

            {isLoading ? (
                <div style={{textAlign: 'center', padding: 20}}>Загрузка...</div>
            ) : themes.length === 0 ? (
                <div style={{textAlign: 'center', padding: 20, opacity: 0.5}}>Нет доступных тем</div>
            ) : (
                themes.map(theme => (
                    <div key={theme.name} className="theme-item">
                        <div className="theme-info">
                            <span className="theme-name">{theme.name}</span>
                            <span className="theme-desc">{theme.description}</span>
                            {theme.isInstalled && (
                                <span className="theme-version">
                                    v{theme.localVersion}
                                    {theme.isUpdateAvailable && <span style={{color: '#ff9800'}}> (Доступна v{theme.version})</span>}
                                </span>
                            )}
                        </div>
                        
                        <div className="theme-actions">
                            {activeTheme === theme.folderName ? (
                                <span className="theme-status active">Активна</span>
                            ) : (
                                <>
                                    {theme.isInstalled && (
                                        <button className="theme-btn delete" onClick={() => handleDelete(theme)} disabled={processingTheme === theme.name}>Удалить</button>
                                    )}
                                    {theme.isUpdateAvailable ? (
                                        <button className="theme-btn update" onClick={() => handleDownload(theme)} disabled={processingTheme === theme.name}>Обновить</button>
                                    ) : !theme.isInstalled ? (
                                        <button className="theme-btn download" onClick={() => handleDownload(theme)} disabled={processingTheme === theme.name}>Загрузить</button>
                                    ) : null}
                                    {theme.isInstalled && (
                                        <button className="theme-btn apply" onClick={() => applyTheme(theme.folderName)}>Применить</button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ThemeSettings;