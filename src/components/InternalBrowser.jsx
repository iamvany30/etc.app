/* @source src/components/InternalBrowser.jsx */
import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useContextMenu } from '../context/ContextMenuContext';
import { useIslandStore } from '../store/islandStore';
import { useBrowser } from '../context/BrowserContext';
import { NavBackIcon, NavForwardIcon, NavReloadIcon, CloseIcon } from './icons/CommonIcons';
import { BrowserMinimizeIcon, BrowserExternalIcon } from './icons/CustomIcons';
import '../styles/InternalBrowser.css';

const InternalBrowser = () => {
    const webviewRef = useRef(null);
    const location = useLocation();

    const { openContextMenu } = useContextMenu();
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const setIslandTheme = useIslandStore(state => state.setIslandTheme);
    const setSiteActivity = useIslandStore(state => state.setSiteActivity);
    
    const { 
        isOpen, isMinimized, url, 
        closeBrowser, minimizeBrowser, updateTitle 
    } = useBrowser();

    const [isRendered, setIsRendered] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setCurrentUrl(url);
            setInputValue(url);
        } else {
            const timer = setTimeout(() => {
                setIsRendered(false);
                setIslandTheme(null);
                setSiteActivity(null);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen, url, setIslandTheme, setSiteActivity]);

    const handleAction = (action) => {
        const wb = webviewRef.current;
        if (!wb) return;
        if (action === 'back') wb.goBack();
        if (action === 'forward') wb.goForward();
        if (action === 'reload') wb.reload();
    };

    const handleOpenExternal = () => {
        window.api?.openExternalLink(currentUrl);
    };

    const handleUrlSubmit = (e) => {
        if (e.key === 'Enter') {
            let target = inputValue.trim();
            if (!target) return;
            
            if (!/^https?:\/\//i.test(target)) {
                if (target.includes('.') && !target.includes(' ')) {
                    target = 'https://' + target;
                } else {
                    target = 'https://www.google.com/search?q=' + encodeURIComponent(target);
                }
            }
            const wb = webviewRef.current;
            if (wb) wb.loadURL(target);
            e.target.blur();
        }
    };

    useEffect(() => {
        const wb = webviewRef.current;
        if (!wb || !isOpen) return;

        const updateState = () => {
            try {
                if (!wb) return;
                setCanGoBack(wb.canGoBack());
                setCanGoForward(wb.canGoForward());
                const newUrl = wb.getURL();
                const title = wb.getTitle();
                setCurrentUrl(newUrl);
                if (title) updateTitle(title);
                if (!isInputFocused) setInputValue(newUrl);
            } catch (e) {}
        };

        const stopLoading = () => { setIsLoading(false); updateState(); };
        const startLoading = () => setIsLoading(true);

        
        const handleContextMenu = (e) => {
            
            const params = e.params || {};
            const { x, y, linkURL, mediaType, srcURL, selectionText } = params;
            
            const items = [];

            if (linkURL) {
                items.push({ isLabel: true, label: 'Ссылка' });
                items.push({ label: 'Открыть в системе', action: () => window.api.openExternalLink(linkURL) });
                items.push({ label: 'Копировать адрес', action: () => navigator.clipboard.writeText(linkURL) });
                items.push({ label: 'Скачать файл', action: () => {
                    window.api.downloadFile(linkURL);
                    showIslandAlert('success', 'Загрузка начата', '📥');
                }});
                items.push({ isSeparator: true });
            }

            if (mediaType === 'image' && srcURL) {
                items.push({ isLabel: true, label: 'Изображение' });
                items.push({ label: 'Скачать картинку', action: () => {
                    window.api.downloadFile(srcURL);
                    showIslandAlert('success', 'Сохранение начато', '🖼️');
                }});
                items.push({ isSeparator: true });
            }

            if (selectionText) {
                items.push({ label: 'Копировать', action: () => wb.copy() });
                items.push({ isSeparator: true });
            }

            items.push({ label: 'Назад', action: () => wb.goBack() });
            items.push({ label: 'Вперед', action: () => wb.goForward() });
            items.push({ label: 'Перезагрузить', action: () => wb.reload() });

            
            const rect = wb.getBoundingClientRect();
            
            openContextMenu(x + rect.left, y + rect.top, items);
        };

        const handleConsoleMessage = (e) => {
            
            const msg = e.message;
            if (typeof msg === 'string') {
                if (msg.startsWith('__ITD_ISLAND_ALERT__:')) {
                    try {
                        const data = JSON.parse(msg.substring(21));
                        showIslandAlert(data.type, data.message, data.icon, data.duration || 4000);
                    } catch(e) {}
                } else if (msg.startsWith('__ITD_ISLAND_THEME__:')) {
                    try {
                        const data = JSON.parse(msg.substring(21));
                        setIslandTheme(data.color1 && data.color2 ? { color1: data.color1, color2: data.color2 } : null);
                    } catch(e) {}
                } else if (msg.startsWith('__ITD_ISLAND_ACTIVITY__:')) {
                    try {
                        setSiteActivity(JSON.parse(msg.substring(24)));
                    } catch(e) {}
                } else if (msg === '__ITD_ISLAND_CLEAR_ACTIVITY__') {
                    setSiteActivity(null);
                }
            }
        };

        const handleDomReady = () => {
            wb.executeJavaScript(`
                window.ItdApp = {
                    island: {
                        alert: (m, t='success', i='✨', d=4000) => console.log('__ITD_ISLAND_ALERT__:'+JSON.stringify({message:m,type:t,icon:i,duration:d})),
                        setTheme: (c1, c2) => console.log('__ITD_ISLAND_THEME__:'+JSON.stringify({color1:c1,color2:c2})),
                        setActivity: (t, s, i='🌐', p=null) => console.log('__ITD_ISLAND_ACTIVITY__:'+JSON.stringify({title:t,subtitle:s,icon:i,progress:p})),
                        clearActivity: () => console.log('__ITD_ISLAND_CLEAR_ACTIVITY__')
                    }
                };
            `).catch(() => {});
        };

        const handleWillNavigate = (e) => {
            const targetUrl = e.url;
            if (targetUrl.match(/\.(zip|rar|7z|exe|pdf|mp3|m4a|wav|mp4|webm|png|jpg|jpeg|gif|dmg|apk|msi)(\?.*)?$/i)) {
                
                
                wb.stop();
                window.api.downloadFile(targetUrl);
                
            }
        };

        const handleNewWindow = (e) => {
            
            e.preventDefault(); 
            const targetUrl = e.url;
            
            if (targetUrl.match(/\.(zip|rar|7z|exe|pdf|mp3|m4a|wav|mp4|webm|png|jpg|jpeg|gif|dmg|apk|msi)(\?.*)?$/i)) {
                window.api.downloadFile(targetUrl);
            } else {
                wb.loadURL(targetUrl); 
            }
        };

        wb.addEventListener('did-navigate', updateState);
        wb.addEventListener('did-navigate-in-page', updateState);
        wb.addEventListener('did-start-loading', startLoading);
        wb.addEventListener('did-stop-loading', stopLoading);
        wb.addEventListener('dom-ready', handleDomReady);
        wb.addEventListener('context-menu', handleContextMenu);
        wb.addEventListener('console-message', handleConsoleMessage);
        wb.addEventListener('will-navigate', handleWillNavigate);
        wb.addEventListener('new-window', handleNewWindow);

        return () => {
            try {
                wb.removeEventListener('did-navigate', updateState);
                wb.removeEventListener('did-navigate-in-page', updateState);
                wb.removeEventListener('did-start-loading', startLoading);
                wb.removeEventListener('did-stop-loading', stopLoading);
                wb.removeEventListener('dom-ready', handleDomReady);
                wb.removeEventListener('context-menu', handleContextMenu);
                wb.removeEventListener('console-message', handleConsoleMessage);
                wb.removeEventListener('will-navigate', handleWillNavigate);
                wb.removeEventListener('new-window', handleNewWindow);
            } catch (e) {}
        };
    }, [isRendered, isOpen, isInputFocused, updateTitle, openContextMenu, showIslandAlert, setIslandTheme, setSiteActivity, inputValue, currentUrl]);

    if (!isRendered) return null;

    const wrapperClass = `internal-browser-wrapper ${isOpen && !isMinimized ? 'open' : 'minimized'}`;

    return (
        <div className={wrapperClass}>
            <div className="browser-toolbar">
                <div className="browser-nav-btns">
                    <button onClick={() => handleAction('back')} disabled={!canGoBack} className="br-icon-btn"><NavBackIcon size={20} /></button>
                    <button onClick={() => handleAction('forward')} disabled={!canGoForward} className="br-icon-btn mobile-hide"><NavForwardIcon size={20} /></button>
                    <button onClick={() => handleAction('reload')} className="br-icon-btn"><NavReloadIcon size={18} /></button>
                </div>
                
                <div className="browser-address-bar">
                    <input 
                        className="br-url-input" 
                        type="text" 
                        value={isInputFocused ? inputValue : currentUrl}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onKeyDown={handleUrlSubmit}
                        placeholder="Введите URL или запрос..."
                    />
                </div>

                <div className="browser-action-btns">
                    <button onClick={minimizeBrowser} className="br-icon-btn" title="Свернуть"><BrowserMinimizeIcon /></button>
                    <button onClick={handleOpenExternal} className="br-icon-btn" title="Открыть в системном браузере"><BrowserExternalIcon /></button>
                    <button onClick={closeBrowser} className="br-close-btn" title="Закрыть вкладку"><CloseIcon size={20} /><span className="br-close-text">Закрыть</span></button>
                </div>
                
                {isLoading && <div className="br-loader-line" />}
            </div>

            <div className="webview-container">
                <webview 
                    ref={webviewRef}
                    src={url}
                    allowpopups="true"
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                />
            </div>
        </div>
    );
};

export default InternalBrowser;