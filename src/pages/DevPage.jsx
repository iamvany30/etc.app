/* @source src/pages/DevPage.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { 
    MonitorSmartphone, ServerSquare, Database, 
    CodeSquare, Settings, TrashBinMinimalistic, 
    Restart, Bug, Bolt, Folder, Archive,
    CheckCircle, DangerCircle, Stop, Pallete,
    Bell, Layers, HomeWiFi, Download, Upload, MusicNote
} from "@solar-icons/react";

import { useModalStore } from '../store/modalStore';
import { useIslandStore } from '../store/islandStore';


import SettingsModal from '../components/modals/SettingsModal';
import EditProfileModal from '../components/modals/EditProfileModal';
import LogoutConfirmModal from '../components/modals/LogoutConfirmModal';
import ConfirmActionModal from '../components/modals/ConfirmActionModal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import BannerEditorModal from '../components/modals/BannerEditorModal';
import LogDumpModal from '../components/modals/LogDumpModal';
import PhoneVerificationModal from '../components/modals/PhoneVerificationModal';
import DevToolsWarningModal from '../components/modals/DevToolsWarningModal';
import ExternalLinkModal from '../components/modals/ExternalLinkModal';
import UserListModal from '../components/modals/UserListModal';
import ImageModal from '../components/modals/ImageModal';

import '../styles/DevPage.css';

const JsonViewer = ({ data }) => {
    if (!data) return <div className="dev-placeholder">Нет данных для отображения...</div>;
    
    
    const highlight = (json) => {
        if (typeof json !== 'string') json = JSON.stringify(json, (k, v) => typeof v === 'function' ? '[Function]' : v, 2);
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) cls = 'json-key';
                else cls = 'json-string';
            } else if (/true|false/.test(match)) cls = 'json-boolean';
            else if (/null/.test(match)) cls = 'json-null';
            return `<span class="${cls}">${match}</span>`;
        });
    };

    return <pre className="json-view custom-scrollbar" dangerouslySetInnerHTML={{ __html: highlight(data) }} />;
};

const DevPage = () => {
    const [activeTab, setActiveTab] = useState('ui');
    const [sysInfo, setSysInfo] = useState(null);
    const [remoteState, setRemoteState] = useState(null);
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('all');
    const [networkStatus, setNetworkStatus] = useState({ api: 'pending', net: 'pending' });
    const logsEndRef = useRef(null);

    
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const setSiteActivity = useIslandStore(state => state.setSiteActivity);
    const setIslandTheme = useIslandStore(state => state.setIslandTheme);

    
    useEffect(() => {
        if (window.api) {
            window.api.invoke('debug:get-system-info').then(setSysInfo);
            const timer = setInterval(async () => {
                try {
                    const state = await window.api.invoke('debug:get-state-snapshot');
                    setRemoteState(state);
                } catch(e) {}
            }, 1000);
            return () => clearInterval(timer);
        }
    }, []);

    
    useEffect(() => {
        const methods = ['log', 'warn', 'error', 'info'];
        const originals = {};
        methods.forEach(method => {
            originals[method] = console[method];
            console[method] = (...args) => {
                const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                setLogs(prev => [...prev.slice(-499), { 
                    type: method, 
                    msg, 
                    time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                }]);
                originals[method].apply(console, args);
            };
        });
        console.info('=== DEV MODE INITIALIZED ===');
        return () => { methods.forEach(method => { console[method] = originals[method]; }); };
    }, []);

    
    useEffect(() => {
        if (activeTab === 'logs' && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, activeTab, logFilter]);

    
    const testNetwork = async () => {
        setNetworkStatus({ api: 'testing', net: 'testing' });
        try {
            const apiRes = await window.api.invoke('app:check-api-status');
            const netRes = await window.api.invoke('app:quick-check');
            setNetworkStatus({ 
                api: apiRes ? 'ok' : 'error', 
                net: netRes ? 'ok' : 'error' 
            });
        } catch (e) {
            setNetworkStatus({ api: 'error', net: 'error' });
        }
    };

    const runAction = async (action) => {
        if (action === 'hard_reset') {
            if (window.confirm('СБРОСИТЬ ВСЁ? Это удалит куки, сессию и кэш Electron.')) {
                localStorage.clear();
                await window.api.invoke('debug:clear-electron-cache');
                await window.api.invoke('debug:reload-main');
                window.location.reload();
            }
            return;
        }
        window.api.invoke(action);
    };

    const toggleOfflineMode = () => {
        const event = new CustomEvent('app-network-status', { detail: 'offline' });
        window.dispatchEvent(event);
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('app-network-status', { detail: 'online' }));
        }, 3000);
    };

    const simulateProgress = (title, subtitle, icon) => {
        let p = 0;
        setSiteActivity({ title, subtitle, icon, progress: 0 });
        const int = setInterval(() => {
            p += Math.floor(Math.random() * 8) + 2;
            if (p > 100) p = 100;
            setSiteActivity({ title, subtitle, icon, progress: p });
            if (p >= 100) {
                clearInterval(int);
                setTimeout(() => {
                    setSiteActivity(null);
                    showIslandAlert('success', 'Завершено', icon);
                }, 800);
            }
        }, 200);
    };

    const triggerIsland = (type) => {
        switch (type) {
            case 'success': showIslandAlert('success', 'Операция выполнена успешно', '✅'); break;
            case 'error': showIslandAlert('error', 'Критическая ошибка соединения', '❌'); break;
            case 'clipboard': showIslandAlert('clipboard', 'Скопировано в буфер обмена', '📋'); break;
            case 'discord': showIslandAlert('discord', 'Подключен аккаунт: User#1234', '🎮'); break;
            case 'long_text': showIslandAlert('success', 'Это очень длинное уведомление, которое должно корректно обрезаться троеточием в конце строки', '📏'); break;
            case 'short_text': showIslandAlert('success', 'ОК', '👌'); break;
            case 'activity_dl': simulateProgress('Загрузка обновления', 'v1.2.0-beta', '⬇️'); break;
            case 'activity_ul': simulateProgress('Отправка файлов', 'archive.zip', '⬆️'); break;
            case 'activity_music': 
                setSiteActivity({ title: 'Сейчас играет', subtitle: 'Rick Astley - Never Gonna Give You Up', icon: '🎵' });
                setTimeout(() => setSiteActivity(null), 4000);
                break;
            case 'theme_ocean': setIslandTheme({ color1: 'rgb(29, 155, 240)', color2: 'rgb(33, 147, 176)' }); break;
            case 'theme_sunset': setIslandTheme({ color1: 'rgb(255, 81, 47)', color2: 'rgb(221, 36, 118)' }); break;
            case 'theme_reset': setIslandTheme(null); break;
            default: break;
        }
    };

    const triggerModal = (type) => {
        switch (type) {
            case 'settings': openModal(<SettingsModal />); break;
            case 'edit_profile': openModal(<EditProfileModal />); break;
            case 'logout': openModal(<LogoutConfirmModal onConfirm={() => alert('Logout confirmed')} />); break;
            case 'confirm_action': openModal(<ConfirmActionModal title="Подтверждение" message="Вы уверены, что хотите выполнить это действие?" onConfirm={() => closeModal()} />); break;
            case 'delete': openModal(<ConfirmDeleteModal onConfirm={() => alert('Deleted')} />); break;
            case 'banner': openModal(<BannerEditorModal onSaveSuccess={(url) => alert(url)} />); break;
            case 'logs': openModal(<LogDumpModal />); break;
            case 'phone': openModal(<PhoneVerificationModal user={{id: 'test', username: 'tester'}} />); break;
            case 'devtools': openModal(<DevToolsWarningModal />); break;
            case 'external': openModal(<ExternalLinkModal url="https://github.com" />); break;
            case 'userlist': openModal(<UserListModal username="admin" type="followers" title="Подписчики" />); break;
            case 'image': openModal(<ImageModal images={[{ url: 'https://picsum.photos/1200/800', type: 'image/jpeg' }]} initialIndex={0} />, { variant: 'fullscreen' }); break;
            default: break;
        }
    };

    const filteredLogs = logs.filter(l => logFilter === 'all' || l.type === logFilter);

    const TABS = [
        { id: 'system', icon: <MonitorSmartphone size={20}/>, label: 'System' },
        { id: 'ui', icon: <Pallete size={20}/>, label: 'UI Kit' }, 
        { id: 'stores', icon: <Database size={20}/>, label: 'State' },
        { id: 'logs', icon: <CodeSquare size={20}/>, label: 'Console' },
        { id: 'network', icon: <ServerSquare size={20}/>, label: 'Network' },
        { id: 'actions', icon: <Settings size={20}/>, label: 'Actions' },
    ];

    return (
        <div className="dev-page">
            <aside className="dev-sidebar">
                <div className="dev-logo">
                    <Bug size={24} color="#2AABEE" variant="Bold" />
                    <span>DEBUG_OS</span>
                </div>
                
                <nav className="dev-nav">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            className={`dev-nav-btn ${activeTab === tab.id ? 'active' : ''}`} 
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                
                <div className="dev-sidebar-footer">
                    <button className="dev-btn danger block" onClick={() => runAction('hard_reset')}>
                        <TrashBinMinimalistic size={18} /> Emergency Reset
                    </button>
                </div>
            </aside>

            <main className="dev-main">
                <header className="dev-header">
                    <h1>{TABS.find(t => t.id === activeTab)?.label}</h1>
                    {sysInfo && <div className="dev-badge">v{sysInfo.version}</div>}
                </header>

                <div className="dev-scroll-area custom-scrollbar">
                    
                    {}
                    {activeTab === 'ui' && (
                        <div className="dev-grid">
                            <div className="dev-card" style={{gridColumn: 'span 2'}}>
                                <h3><Bell size={18} variant="Bold"/> Dynamic Island</h3>
                                <div className="dev-action-list">
                                    <div style={{display:'flex', gap: 10, flexWrap:'wrap'}}>
                                        <button className="dev-btn small" onClick={() => triggerIsland('success')}>Success</button>
                                        <button className="dev-btn small danger" onClick={() => triggerIsland('error')}>Error</button>
                                        <button className="dev-btn small" onClick={() => triggerIsland('clipboard')}>Clipboard</button>
                                        <button className="dev-btn small primary" onClick={() => triggerIsland('discord')}>Discord</button>
                                        <button className="dev-btn small" onClick={() => triggerIsland('theme_ocean')}>Theme Ocean</button>
                                        <button className="dev-btn small" onClick={() => triggerIsland('theme_reset')}>Theme Reset</button>
                                    </div>
                                    <div style={{borderTop:'1px solid var(--dev-border)', paddingTop: 16, marginTop: 4}}>
                                        <p style={{fontSize:12, fontWeight:700, color:'var(--dev-text-muted)', marginBottom:10}}>LIVE ACTIVITIES & STRESS TEST</p>
                                        <div style={{display:'flex', gap: 10, flexWrap:'wrap'}}>
                                            <button className="dev-btn small primary" onClick={() => triggerIsland('activity_dl')}><Download size={14}/> Download</button>
                                            <button className="dev-btn small primary" onClick={() => triggerIsland('activity_ul')}><Upload size={14}/> Upload</button>
                                            <button className="dev-btn small" onClick={() => triggerIsland('activity_music')}><MusicNote size={14}/> Player</button>
                                            <button className="dev-btn small danger" onClick={toggleOfflineMode}><HomeWiFi size={14}/> Offline Sim</button>
                                            <button className="dev-btn small" onClick={() => triggerIsland('long_text')}>Long Text</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dev-card">
                                <h3><Layers size={18} variant="Bold"/> Modals</h3>
                                <div className="dev-action-list" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
                                    <button className="dev-btn small" onClick={() => triggerModal('settings')}>Settings</button>
                                    <button className="dev-btn small" onClick={() => triggerModal('edit_profile')}>Edit Profile</button>
                                    <button className="dev-btn small" onClick={() => triggerModal('confirm_action')}>Confirm</button>
                                    <button className="dev-btn small danger" onClick={() => triggerModal('delete')}>Delete</button>
                                    <button className="dev-btn small danger" onClick={() => triggerModal('logout')}>Logout</button>
                                    <button className="dev-btn small" onClick={() => triggerModal('banner')}>Banner</button>
                                    <button className="dev-btn small primary" onClick={() => triggerModal('phone')}>Verify</button>
                                    <button className="dev-btn small" onClick={() => triggerModal('image')}>Gallery</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'system' && (
                        <div className="dev-grid">
                            <div className="dev-card">
                                <h3>Environment</h3>
                                <div className="dev-stat-row"><span>Platform</span><strong>{sysInfo?.platform} ({sysInfo?.arch})</strong></div>
                                <div className="dev-stat-row"><span>Version</span><strong>v{sysInfo?.version}</strong></div>
                                <div className="dev-stat-row"><span>Electron</span><strong>{sysInfo?.electron}</strong></div>
                                <div className="dev-stat-row"><span>Chromium</span><strong>{sysInfo?.chrome}</strong></div>
                            </div>
                            
                            <div className="dev-card">
                                <h3>Hardware</h3>
                                <div className="dev-stat-row"><span>CPU Cores</span><strong>{sysInfo?.cpus}</strong></div>
                                <div className="dev-stat-row"><span>Memory</span><strong>{sysInfo?.memory}</strong></div>
                                <div className="dev-stat-row"><span>Uptime</span><strong>{sysInfo?.uptime}</strong></div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'stores' && (
                        <div className="dev-stores-layout">
                            <div className="dev-card">
                                <details open>
                                    <summary><Database size={16}/> USER_STORE</summary>
                                    <JsonViewer data={remoteState?.user} />
                                </details>
                            </div>
                            <div className="dev-card">
                                <details>
                                    <summary><Database size={16}/> MUSIC_STORE</summary>
                                    <JsonViewer data={remoteState?.music} />
                                </details>
                            </div>
                            <div className="dev-card">
                                <details>
                                    <summary><Database size={16}/> DOWNLOAD_STORE</summary>
                                    <JsonViewer data={remoteState?.download} />
                                </details>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'network' && (
                        <div className="dev-card network-card">
                            <div className="network-header">
                                <div>
                                    <h3>Network Status</h3>
                                    <p>Connection and API health check</p>
                                </div>
                                <button className="dev-btn primary" onClick={testNetwork}>
                                    <Bolt size={18} /> Run Diagnostics
                                </button>
                            </div>
                            <div className="network-status-grid">
                                <div className={`net-box ${networkStatus.net}`}>
                                    <div className="net-icon">
                                        {networkStatus.net === 'ok' ? <CheckCircle size={32} variant="Bold"/> : networkStatus.net === 'error' ? <DangerCircle size={32} variant="Bold"/> : <Stop size={32} variant="Bold"/>}
                                    </div>
                                    <div className="net-info">
                                        <h4>Internet</h4>
                                        <span>{networkStatus.net === 'testing' ? 'Checking...' : networkStatus.net.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className={`net-box ${networkStatus.api}`}>
                                    <div className="net-icon">
                                        {networkStatus.api === 'ok' ? <CheckCircle size={32} variant="Bold"/> : networkStatus.api === 'error' ? <DangerCircle size={32} variant="Bold"/> : <Stop size={32} variant="Bold"/>}
                                    </div>
                                    <div className="net-info">
                                        <h4>API Server</h4>
                                        <span>{networkStatus.api === 'testing' ? 'Checking...' : networkStatus.api.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'actions' && (
                        <div className="dev-grid">
                            <div className="dev-card">
                                <h3>Window Control</h3>
                                <div className="dev-action-list">
                                    <button className="dev-btn" onClick={() => runAction('debug:reload-main')}>
                                        <Restart size={18} /> Reload Main Window
                                    </button>
                                    <button className="dev-btn" onClick={() => runAction('debug:toggle-devtools')}>
                                        <CodeSquare size={18} /> Toggle DevTools
                                    </button>
                                </div>
                            </div>
                            <div className="dev-card">
                                <h3>File System</h3>
                                <div className="dev-action-list">
                                    <button className="dev-btn" onClick={() => runAction('debug:open-userdata')}>
                                        <Folder size={18} /> Open AppData
                                    </button>
                                    <button className="dev-btn primary" onClick={() => runAction('app:dump-logs-zip')}>
                                        <Archive size={18} /> Save Logs Archive
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'logs' && (
                        <div className="dev-console-wrapper">
                            <div className="console-toolbar">
                                <div className="console-filters">
                                    {['all', 'log', 'info', 'warn', 'error'].map(type => (
                                        <button 
                                            key={type} 
                                            className={`filter-btn ${logFilter === type ? 'active' : ''} ${type}`}
                                            onClick={() => setLogFilter(type)}
                                        >
                                            {type.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <button className="dev-btn small" onClick={() => setLogs([])}>Clear</button>
                            </div>
                            <div className="console-output custom-scrollbar">
                                {filteredLogs.length === 0 && <div className="dev-placeholder" style={{padding:20}}>Нет логов...</div>}
                                {filteredLogs.map((log, i) => (
                                    <div key={i} className={`log-row ${log.type}`}>
                                        <span className="log-time">[{log.time}]</span>
                                        <span className="log-msg">{log.msg}</span>
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DevPage;