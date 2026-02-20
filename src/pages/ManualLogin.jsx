import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AltArrowLeft, 
    DocumentAdd, 
    Download, 
    CheckRead, 
    Danger,
    FileText,
    Key,
    InfoCircle
} from "@solar-icons/react";
import '../styles/ManualLogin.css';

const EXTENSION_URL = "https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm";


const jsonSteps = [
    { id: 1, img: "guide/step1.png", title: "Вход в аккаунт", desc: "Откройте обычный браузер (Chrome/Edge), перейдите на сайт и авторизуйтесь. Убедитесь, что прошли проверку Cloudflare." },
    { id: 2, img: "guide/step2.png", title: "Откройте Cookie-Editor", desc: "Нажмите на иконку расширения в панели браузера. Вы увидите список всех куки текущего сайта." },
    { id: 3, img: "guide/step3.png", title: "Фильтрация", desc: "Если вы находитесь на странице с другими куки, введите в поиске расширения часть домена (например, 'xn--d1ah4a' или 'итд')." },
    { id: 4, img: "guide/step4.png", title: "Проверка", desc: "Убедитесь, что в списке есть куки авторизации (обычно их 4 или более, включая refresh_token)." },
    { id: 5, img: "guide/step5.png", title: "Экспорт", desc: "Внизу расширения нажмите кнопку 'Export', затем выберите формат 'Export as JSON'." },
    { id: 6, img: "guide/step6.png", title: "Пароль (Важно!)", desc: "Расширение попросит ввести пароль для шифрования. Обязательно введите «123» (без кавычек), иначе приложение не сможет прочитать файл." },
    { id: 7, img: "guide/step7.png", title: "Сохранение", desc: "Нажмите синюю кнопку 'Save'. Браузер скачает файл 'cookies.json' на ваш компьютер." },
    { id: 8, img: "guide/step8.png", title: "Загрузка в приложение", desc: "Перетащите полученный файл в поле справа или откройте его блокнотом и скопируйте текст." }
];

const ManualLogin = () => {
    const navigate = useNavigate();
    
    
    const [jsonInput, setJsonInput] = useState('');
    const [tokenInput, setTokenInput] = useState('');
    const [fileName, setFileName] = useState(null);
    
    
    
    const [mode, setMode] = useState('json_file'); 
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const fileInputRef = useRef(null);

    
    const handleFile = (file) => {
        if (!file) return;
        if (file.type && file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setError("Пожалуйста, выберите файл с расширением .json");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setJsonInput(e.target.result);
            setFileName(file.name);
            setError(null);
        };
        reader.onerror = () => setError("Не удалось прочитать файл");
        reader.readAsText(file);
    };

    const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            
            if (mode !== 'json_file') setMode('json_file');
        }
    };

    
    const handleLogin = async () => {
        setError(null);
        setIsLoading(true);

        try {
            await new Promise(r => setTimeout(r, 600)); 

            let response;

            if (mode === 'token') {
                
                if (!tokenInput.trim()) throw new Error("Поле токена пустое");
                
                
                const cleanToken = tokenInput.trim().replace(/^"|"$/g, '');
                response = await window.api.invoke('auth:token-login', cleanToken);

            } else {
                
                if (!jsonInput.trim()) throw new Error("Данные JSON отсутствуют");
                response = await window.api.invoke('auth:manual-import', jsonInput);
            }

            if (response.success) {
                
                navigate('/');
                
                window.location.reload(); 
            } else {
                
                if (mode === 'token') {
                    setError(response.error || "Токен недействителен или истек.");
                } else {
                    setError(response.error || "Ошибка формата. Убедитесь, что пароль при экспорте был '123'.");
                }
            }
        } catch (e) {
            setError(e.message || "Произошла неизвестная ошибка");
        } finally {
            setIsLoading(false);
        }
    };

    

    
    const GuideJsonDetailed = () => (
        <div className="guide-scroll-container">
            <div className="guide-intro">
                <h1>Вход через Cookies</h1>
                <p>Этот метод позволяет обойти сетевые блокировки. Вам понадобится браузерное расширение <b>Cookie-Editor</b>.</p>
                <button className="download-ext-btn" onClick={() => window.api.openExternalLink(EXTENSION_URL)}>
                    <Download size={20} />
                    <span>Скачать Cookie-Editor</span>
                </button>
            </div>

            <div className="steps-grid">
                {jsonSteps.map((step, index) => (
                    <div key={step.id} className="guide-card" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="card-header">
                            <span className="step-tag">{step.id}</span>
                            <h3>{step.title}</h3>
                        </div>
                        <p>{step.desc}</p>
                        {step.img && (
                            <div className="img-zoom-wrap">
                                {}
                                <img src={`${process.env.PUBLIC_URL}/${step.img}`} alt={`Шаг ${step.id}`} loading="lazy" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="guide-note" style={{ marginTop: 24, padding: 12, background: 'rgba(255, 173, 31, 0.1)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Danger color="#ffad1f" size={24} style={{flexShrink: 0}} />
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <strong style={{ color: '#ffad1f' }}>Внимание:</strong> Если расширение запрашивает пароль, обязательно введите <code>123</code>. Иначе приложение не сможет расшифровать ваши данные.
                </div>
            </div>
        </div>
    );

    
    const GuideToken = () => (
        <div className="guide-scroll-container">
            <div className="guide-intro">
                <h1>Вход через Токен</h1>
                <p>Быстрый способ для продвинутых пользователей. Не требует скачивания файлов.</p>
            </div>

            <div className="steps-grid">
                <div className="guide-card">
                    <div className="card-header"><span className="step-tag">1</span><h3>Инструменты разработчика</h3></div>
                    <p>На сайте нажмите <code>F12</code> (или ПКМ -&gt; Просмотреть код).</p>
                </div>
                <div className="guide-card">
                    <div className="card-header"><span className="step-tag">2</span><h3>Вкладка Application</h3></div>
                    <p>Перейдите во вкладку <b>Application</b> (Приложение) в верхней панели DevTools.</p>
                </div>
                <div className="guide-card">
                    <div className="card-header"><span className="step-tag">3</span><h3>Cookies</h3></div>
                    <p>В меню слева: Storage -&gt; Cookies -&gt; https://xn--d1ah4a.com</p>
                </div>
                <div className="guide-card">
                    <div className="card-header"><span className="step-tag">4</span><h3>Копирование</h3></div>
                    <p>Найдите строку <code>refresh_token</code>. Скопируйте её значение и вставьте в поле справа.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="manual-login-page">
                {}
                <div className="manual-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <AltArrowLeft size={24} />
                        <span>Назад</span>
                    </button>
                    <div className="header-title">Ручная авторизация</div>
                    <div style={{ width: 80 }}></div>
                </div>

                {}
                <div className="manual-layout">
                    
                    {}
                    {mode === 'token' ? <GuideToken /> : <GuideJsonDetailed />}

                    {}
                    <div className="input-sticky-sidebar">
                        <div className="input-panel">
                            
                            {}
                            <div className="panel-tabs" style={{ gap: 4, background: 'var(--color-input-bg)', padding: 4, borderRadius: 12 }}>
                                <button 
                                    className={`panel-tab ${mode === 'json_file' ? 'active' : ''}`} 
                                    onClick={() => { setMode('json_file'); setError(null); }}
                                    title="Загрузить файл JSON"
                                >
                                    <DocumentAdd size={18} />
                                    <span style={{marginLeft: 6}}>Файл</span>
                                </button>
                                <button 
                                    className={`panel-tab ${mode === 'json_text' ? 'active' : ''}`} 
                                    onClick={() => { setMode('json_text'); setError(null); }}
                                    title="Вставить JSON текст"
                                >
                                    <FileText size={18} />
                                    <span style={{marginLeft: 6}}>Текст</span>
                                </button>
                                <button 
                                    className={`panel-tab ${mode === 'token' ? 'active' : ''}`} 
                                    onClick={() => { setMode('token'); setError(null); }}
                                    title="Вставить Refresh Token"
                                >
                                    <Key size={18} />
                                    <span style={{marginLeft: 6}}>Токен</span>
                                </button>
                            </div>

                            {}
                            <div style={{ marginBottom: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                                {mode === 'json_file' && "Импорт файла cookies.json"}
                                {mode === 'json_text' && "Вставка JSON кода"}
                                {mode === 'token' && "Вход по Refresh Token"}
                            </div>

                            {}
                            <div className="input-content-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                
                                {}
                                {mode === 'json_file' && (
                                    <div 
                                        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${fileName ? 'has-file' : ''}`}
                                        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <input type="file" ref={fileInputRef} onChange={(e) => handleFile(e.target.files[0])} accept=".json" style={{display: 'none'}}/>
                                        {fileName ? (
                                            <div className="file-info">
                                                <div className="file-icon-wrap"><CheckRead size={40} color="#00ba7c"/></div>
                                                <span className="file-name">{fileName}</span>
                                                <span className="file-status">Файл готов</span>
                                                <div className="change-file-hint">Нажмите для замены</div>
                                            </div>
                                        ) : (
                                            <div className="drop-placeholder">
                                                <div className="icon-circle"><DocumentAdd size={32} /></div>
                                                <h3>Перетащите файл</h3>
                                                <p>cookies.json</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {}
                                {mode === 'json_text' && (
                                    <textarea className="json-area"
                                        placeholder='Скопируйте всё содержимое файла cookies.json и вставьте сюда...'
                                        value={jsonInput}
                                        onChange={(e) => { setJsonInput(e.target.value); setFileName(null); setError(null); }}
                                        spellCheck={false}
                                    />
                                )}

                                {}
                                {mode === 'token' && (
                                    <textarea className="json-area"
                                        placeholder='Вставьте значение refresh_token из DevTools...'
                                        value={tokenInput}
                                        onChange={(e) => { setTokenInput(e.target.value); setError(null); }}
                                        spellCheck={false}
                                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                                    />
                                )}
                            </div>

                            {}
                            {error && (
                                <div className="error-msg">
                                    <Danger size={16} style={{ flexShrink: 0 }} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {}
                            <button 
                                className="confirm-import-btn" 
                                disabled={
                                    isLoading || 
                                    (mode === 'token' && !tokenInput.trim()) || 
                                    (mode !== 'token' && !jsonInput.trim())
                                } 
                                onClick={handleLogin}
                            >
                                {isLoading ? 'Проверка...' : 'Войти в аккаунт'}
                            </button>

                            {}
                            <div className="security-note">
                                <InfoCircle size={12} style={{marginRight: 4, verticalAlign: 'text-bottom'}}/>
                                Данные сохраняются локально (SafeStorage)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualLogin;