/* @source src/pages/DevPage.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { 
    MonitorSmartphone, ServerSquare, Database, 
    CodeSquare, Settings, TrashBinMinimalistic, 
    Restart, Bug, Bolt, Folder, Archive,
    CheckCircle, DangerCircle, Stop, Pallete,
    Bell, Layers
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
    if (!data) return <div className="dev-placeholder">Ожидание данных...</div>;
    
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

    return <pre className="json-view" dangerouslySetInnerHTML={{ __html: highlight(data) }} />;
};

const DevPage = () => {
    const [activeTab, setActiveTab] = useState('system');
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
                setLogs(prev => [...prev.slice(-299), { 
                    type: method, 
                    msg, 
                    time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                }]);
                originals[method].apply(console, args);
            };
        });

        console.info('=== итд.app Debug OS Инициализирована ===');

        return () => {
            methods.forEach(method => { console[method] = originals[method]; });
        };
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

    
    const triggerIsland = (type) => {
        switch (type) {
            case 'success': showIslandAlert('success', 'Операция выполнена', '✅'); break;
            case 'error': showIslandAlert('error', 'Произошла ошибка', '❌'); break;
            case 'clipboard': showIslandAlert('clipboard', 'Скопировано в буфер', '📋'); break;
            case 'discord': showIslandAlert('discord', 'Discord подключен', '🎮'); break;
            case 'long': showIslandAlert('success', 'Очень длинное сообщение для проверки адаптивности ширины острова', '📏'); break;
            case 'activity_start': 
                setSiteActivity({ title: 'Загрузка файла', subtitle: 'image_2024.png', progress: 45, icon: '📥' }); 
                break;
            case 'activity_stop': 
                setSiteActivity(null); 
                break;
            default: break;
        }
    };

    const triggerModal = (type) => {
        switch (type) {
            case 'settings': openModal(<SettingsModal />); break;
            case 'edit_profile': openModal(<EditProfileModal />); break;
            case 'logout': openModal(<LogoutConfirmModal onConfirm={() => alert('Logout confirmed')} />); break;
            case 'confirm_action': 
                openModal(<ConfirmActionModal title="Тестовое действие" message="Вы уверены, что хотите нажать эту кнопку?" onConfirm={() => closeModal()} />); 
                break;
            case 'delete': openModal(<ConfirmDeleteModal onConfirm={() => alert('Deleted')} />); break;
            case 'banner': openModal(<BannerEditorModal onSaveSuccess={(url) => alert(url)} />); break;
            case 'logs': openModal(<LogDumpModal />); break;
            case 'phone': openModal(<PhoneVerificationModal user={{id: 'test', username: 'test'}} />); break;
            case 'devtools': openModal(<DevToolsWarningModal />); break;
            case 'external': openModal(<ExternalLinkModal url="https://google.com" />); break;
            case 'userlist': openModal(<UserListModal username="iamvany" type="followers" title="Тестовый список" />); break;
            case 'image': 
                openModal(
                    <ImageModal 
                        images={[{ url: 'https://picsum.photos/1200/800', type: 'image/jpeg' }, { url: 'https://picsum.photos/800/1200', type: 'image/jpeg' }]} 
                        initialIndex={0} 
                    />, 
                    { variant: 'fullscreen' }
                ); 
                break;
            default: break;
        }
    };

    const filteredLogs = logs.filter(l => logFilter === 'all' || l.type === logFilter);

    
    const TABS = [
        { id: 'system', icon: <MonitorSmartphone size={20}/>, label: 'Система' },
        { id: 'ui', icon: <Pallete size={20}/>, label: 'UI Kit' }, 
        { id: 'stores', icon: <Database size={20}/>, label: 'Инспектор' },
        { id: 'logs', icon: <CodeSquare size={20}/>, label: 'Консоль' },
        { id: 'network', icon: <ServerSquare size={20}/>, label: 'Сеть' },
        { id: 'actions', icon: <Settings size={20}/>, label: 'Действия' },
    ];

    return (
        <div className="dev-page">
            {}
            <aside className="dev-sidebar">
                <div className="dev-logo">
                    <Bug size={24} color="#58a6ff" />
                    <span>ETC_DEBUG_OS</span>
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

            {}
            <main className="dev-main">
                <header className="dev-header">
                    <h1>{TABS.find(t => t.id === activeTab)?.label}</h1>
                    {sysInfo && <div className="dev-badge">v{sysInfo.version}</div>}
                </header>

                <div className="dev-scroll-area">
                    {}
                    {activeTab === 'ui' && (
                        <div className="dev-grid">
                            <div className="dev-card">
                                <h3><Bell size={16}/> Dynamic Island</h3>
                                <div className="dev-action-list">
                                    <div style={{display:'flex', gap: 8, flexWrap:'wrap'}}>
                                        <button className="dev-btn small" onClick={() => triggerIsland('success')}>Success</button>
                                        <button className="dev-btn small danger" onClick={() => triggerIsland('error')}>Error</button>
                                        <button className="dev-btn small" onClick={() => triggerIsland('clipboard')}>Clipboard</button>
                                        <button className="dev-btn small primary" onClick={() => triggerIsland('discord')}>Discord</button>
                                        <button className="dev-btn small" onClick={() => triggerIsland('long')}>Long Text</button>
                                    </div>
                                    <div style={{marginTop: 10, paddingTop: 10, borderTop: '1px solid #30363d'}}>
                                        <p style={{fontSize: 12, color: '#8b949e', marginBottom: 8}}>Live Activity</p>
                                        <div style={{display:'flex', gap: 8}}>
                                            <button className="dev-btn small primary" onClick={() => triggerIsland('activity_start')}>Start Activity</button>
                                            <button className="dev-btn small" onClick={() => triggerIsland('activity_stop')}>Stop Activity</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dev-card">
                                <h3><Layers size={16}/> Modals & Dialogs</h3>
                                <div className="dev-action-list">
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                        <button className="dev-btn small" onClick={() => triggerModal('settings')}>Settings</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('edit_profile')}>Edit Profile</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('confirm_action')}>Action Confirm</button>
                                        <button className="dev-btn small danger" onClick={() => triggerModal('delete')}>Delete Confirm</button>
                                        <button className="dev-btn small danger" onClick={() => triggerModal('logout')}>Logout Confirm</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('banner')}>Banner Editor</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('logs')}>Log Dump</button>
                                        <button className="dev-btn small primary" onClick={() => triggerModal('phone')}>Phone Verify</button>
                                        <button className="dev-btn small danger" onClick={() => triggerModal('devtools')}>DevTools Warn</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('external')}>External Link</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('userlist')}>User List</button>
                                        <button className="dev-btn small" onClick={() => triggerModal('image')}>Image Viewer</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'system' && (
                        <div className="dev-grid">
                            <div className="dev-card">
                                <h3>Среда выполнения</h3>
                                <div className="dev-stat-row"><span>ОС (Платформа)</span><strong>{sysInfo?.platform} ({sysInfo?.arch})</strong></div>
                                <div className="dev-stat-row"><span>Приложение</span><strong>v{sysInfo?.version}</strong></div>
                                <div className="dev-stat-row"><span>Electron</span><strong>{sysInfo?.electron}</strong></div>
                                <div className="dev-stat-row"><span>Node.js</span><strong>{sysInfo?.node}</strong></div>
                                <div className="dev-stat-row"><span>Chromium</span><strong>{sysInfo?.chrome}</strong></div>
                            </div>
                            
                            <div className="dev-card">
                                <h3>Аппаратные ресурсы</h3>
                                <div className="dev-stat-row"><span>Процессор (Ядра)</span><strong>{sysInfo?.cpus} шт.</strong></div>
                                <div className="dev-stat-row"><span>ОЗУ (Всего)</span><strong>{sysInfo?.memory}</strong></div>
                                <div className="dev-stat-row"><span>Аптайм процесса</span><strong>{sysInfo?.uptime}</strong></div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'stores' && (
                        <div className="dev-stores-layout">
                            <div className="dev-card expandable">
                                <details open>
                                    <summary><Database size={16}/> USER_STORE (Сессия)</summary>
                                    <JsonViewer data={remoteState?.user} />
                                </details>
                            </div>
                            <div className="dev-card expandable">
                                <details>
                                    <summary><Database size={16}/> MUSIC_STORE (Плеер)</summary>
                                    <JsonViewer data={remoteState?.music} />
                                </details>
                            </div>
                            <div className="dev-card expandable">
                                <details>
                                    <summary><Database size={16}/> DOWNLOAD_STORE (Файлы)</summary>
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
                                    <h3>Статус Соединения</h3>
                                    <p>Проверка доступности интернета и серверов итд.app</p>
                                </div>
                                <button className="dev-btn primary" onClick={testNetwork}>
                                    <Bolt size={18} /> Тест связи
                                </button>
                            </div>
                            
                            <div className="network-status-grid">
                                <div className={`net-box ${networkStatus.net}`}>
                                    <div className="net-icon">
                                        {networkStatus.net === 'ok' ? <CheckCircle size={32}/> : 
                                         networkStatus.net === 'error' ? <DangerCircle size={32}/> : <Stop size={32}/>}
                                    </div>
                                    <div className="net-info">
                                        <h4>Интернет</h4>
                                        <span>{networkStatus.net === 'testing' ? 'Проверка...' : networkStatus.net.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className={`net-box ${networkStatus.api}`}>
                                    <div className="net-icon">
                                        {networkStatus.api === 'ok' ? <CheckCircle size={32}/> : 
                                         networkStatus.api === 'error' ? <DangerCircle size={32}/> : <Stop size={32}/>}
                                    </div>
                                    <div className="net-info">
                                        <h4>API Сервер</h4>
                                        <span>{networkStatus.api === 'testing' ? 'Проверка...' : networkStatus.api.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {activeTab === 'actions' && (
                        <div className="dev-grid">
                            <div className="dev-card">
                                <h3>Управление Окном</h3>
                                <div className="dev-action-list">
                                    <button className="dev-btn" onClick={() => runAction('debug:reload-main')}>
                                        <Restart size={18} /> Перезагрузить Main
                                    </button>
                                    <button className="dev-btn" onClick={() => runAction('debug:toggle-devtools')}>
                                        <CodeSquare size={18} /> Toggle DevTools (Main)
                                    </button>
                                </div>
                            </div>
                            <div className="dev-card">
                                <h3>Файловая система</h3>
                                <div className="dev-action-list">
                                    <button className="dev-btn" onClick={() => runAction('debug:open-userdata')}>
                                        <Folder size={18} /> Открыть AppData
                                    </button>
                                    <button className="dev-btn primary" onClick={() => runAction('app:dump-logs-zip')}>
                                        <Archive size={18} /> Сохранить Logs.zip
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
                                <button className="dev-btn small" onClick={() => setLogs([])}>Очистить</button>
                            </div>
                            <div className="console-output custom-scrollbar">
                                {filteredLogs.length === 0 && <div className="dev-placeholder">Нет логов...</div>}
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