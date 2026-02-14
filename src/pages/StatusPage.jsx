import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StatusPage.css'; 

const StatusPage = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overallStatus, setOverallStatus] = useState('checking'); 

    const runTest = async () => {
        setLoading(true);
        setResults([]);
        try {
            const data = await window.api.runDiagnostics();
            setResults(data);
            
            const api = data.find(x => x.name === 'API Сервер');
            const internet = data.filter(x => x.name !== 'API Сервер' && x.status === 'ok');

            if (internet.length === 0) {
                setOverallStatus('offline');
            } else if (!api || api.status !== 'ok') {
                setOverallStatus('server_down');
            } else {
                setOverallStatus('ok');
            }
        } catch (e) {
            setOverallStatus('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runTest();
    }, []);

    const getStatusIcon = (status) => {
        if (status === 'ok') return <span style={{color: '#00ba7c'}}>●</span>;
        if (status === 'fail') return <span style={{color: '#f4212e'}}>✕</span>;
        return <span style={{color: '#ffad1f'}}>!</span>;
    };

    const getRecommendation = () => {
        switch (overallStatus) {
            case 'offline':
                return "Похоже, у вас отсутствует подключение к интернету. Проверьте кабель, Wi-Fi или роутер.";
            case 'server_down':
                return "Интернет работает, но наши серверы недоступны. Возможно, идут технические работы или блокировка. Попробуйте VPN.";
            case 'ok':
                return "Все системы работают нормально. Если проблема сохраняется, попробуйте перезагрузить приложение.";
            default:
                return "Диагностика завершена.";
        }
    };

    return (
        <div className="status-page">
            <div className="status-card">
                <header className="status-header">
                    <h2>Диагностика сети</h2>
                    <button className="close-btn" onClick={() => navigate(-1)}>Закрыть</button>
                </header>

                <div className="status-summary">
                    {loading ? (
                        <div className="status-spinner">Сканирование узлов...</div>
                    ) : (
                        <div className={`status-badge ${overallStatus}`}>
                            {overallStatus === 'ok' ? 'СИСТЕМЫ В НОРМЕ' : 
                             overallStatus === 'offline' ? 'НЕТ СЕТИ' : 'ОШИБКА СЕРВЕРА'}
                        </div>
                    )}
                </div>

                <div className="diagnostics-list">
                    {results.map((res, idx) => (
                        <div key={idx} className="diagnostic-row">
                            <div className="d-name">{res.name}</div>
                            <div className="d-line"></div>
                            <div className="d-meta">
                                {res.ping ? `${res.ping}ms` : ''}
                                {res.error ? <span className="d-error">{res.error}</span> : ''}
                            </div>
                            <div className="d-status">{getStatusIcon(res.status)}</div>
                        </div>
                    ))}
                </div>

                {!loading && (
                    <div className="status-recommendation">
                        <strong>Рекомендация:</strong>
                        <p>{getRecommendation()}</p>
                    </div>
                )}

                <div className="status-actions">
                    <button className="action-btn" onClick={runTest} disabled={loading}>
                        {loading ? 'Проверка...' : 'Запустить повторно'}
                    </button>
                    {overallStatus === 'ok' && (
                        <button className="action-btn primary" onClick={() => navigate('/')}>
                            Вернуться на главную
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusPage;