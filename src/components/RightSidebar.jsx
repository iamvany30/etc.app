 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import '../styles/RightSidebar.css';

/**
 * Вспомогательный компонент для обертки блоков в сайдбаре
 */
const WidgetBox = ({ title, children, showMoreLink }) => (
    <div className="widget-box">
        <h2 className="widget-title">{title}</h2>
        {children}
        {showMoreLink && (
            <Link to={showMoreLink} className="widget-more">
                Показать еще
            </Link>
        )}
    </div>
);

const RightSidebar = () => {
    const [trends, setTrends] = useState([]);
    const [users, setUsers] = useState([]);
    const [clans, setClans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                 
                const [trendsRes, usersRes, clansRes] = await Promise.all([
                    apiClient.getExplore(),
                    apiClient.getSuggestions(),
                    apiClient.getTopClans()
                ]);

                 
                setTrends(trendsRes?.data?.hashtags?.slice(0, 5) || []);
                
                 
                setUsers(usersRes?.users?.slice(0, 3) || []);
                
                 
                setClans(clansRes?.clans?.slice(0, 10) || []);
            } catch (error) {
                console.error("Ошибка загрузки данных сайдбара:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarData();
    }, []);

    if (loading && trends.length === 0) {
        return <aside className="right-sidebar"><div className="loading-indicator">...</div></aside>;
    }

    return (
        <aside className="right-sidebar">
            { }
            {trends.length > 0 && (
                <WidgetBox title="Актуальные темы" showMoreLink="/explore">
                    {trends.map((item) => (
                        <div key={item.id} className="widget-item">
                            <div className="widget-item-info">
                                <span className="category">Актуально сейчас</span>
                                <span className="name">#{item.name}</span>
                                <span className="count">
                                    {item.postsCount.toLocaleString()} постов
                                </span>
                            </div>
                        </div>
                    ))}
                </WidgetBox>
            )}

            { }
            {clans.length > 0 && (
                <WidgetBox title="Топ кланов">
                    <div className="top-clans__list">
                        {clans.map((clan, index) => (
                            <div 
                                key={index} 
                                className={`clan-tag ${index < 3 ? 'top-3' : ''}`}
                                title={clan.name || 'Клан'}
                            >
                                <span>{index + 1}. {clan.avatar}</span>
                                <span style={{ opacity: 0.7, fontSize: '12px' }}>
                                    {clan.memberCount}
                                </span>
                            </div>
                        ))}
                    </div>
                </WidgetBox>
            )}

            { }
            {users.length > 0 && (
                <WidgetBox title="Кого читать" showMoreLink="/explore">
                    {users.map((user) => (
                        <Link 
                            to={`/profile/${user.username}`} 
                            key={user.id} 
                            className="widget-item"
                        >
                            <div className="avatar" style={{ width: 40, height: 40, fontSize: 20 }}>
                                {user.avatar || "👤"}
                            </div>
                            <div className="widget-item-info">
                                <span className="name">{user.displayName}</span>
                                <span className="count">@{user.username}</span>
                            </div>
                        </Link>
                    ))}
                </WidgetBox>
            )}

            { }
            <div className="sidebar-footer-copy">
                © 2026 итд.app (by Ванёк)
            </div>
        </aside>
    );
};

export default RightSidebar;