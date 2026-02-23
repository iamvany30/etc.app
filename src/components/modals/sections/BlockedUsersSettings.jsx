import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/client';
import { BlockedUsersSkeleton } from '../../Skeletons';
import '../../../styles/settings/Accounts.css';

const BlockedUsersSettings = ({ setStatus }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const loadUsers = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await apiClient.getBlockedUsers(pageNum, 20);
            if (res.data) {
                if (pageNum === 1) setUsers(res.data.users || []);
                else setUsers(prev => [...prev, ...(res.data.users || [])]);
                setHasMore(res.data.pagination?.hasMore || false);
                setPage(pageNum);
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Не удалось загрузить список' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(1); }, []);

    const handleUnblock = async (id, username) => {
        try {
            const res = await apiClient.unblockUser(username);
            if (res.success || !res.error) {
                setUsers(users.filter(u => u.id !== id));
                setStatus({ type: 'success', msg: 'Пользователь разблокирован' });
            } else {
                setStatus({ type: 'error', msg: res.error?.message || 'Ошибка' });
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Ошибка сети' });
        }
    };

    if (loading && page === 1) return <BlockedUsersSkeleton count={4} />;

    if (users.length === 0) return (
        <div className="settings-content" style={{textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)'}}>
            <div style={{fontSize: 48, marginBottom: 16}}>🛡️</div>
            <h3>Нет заблокированных</h3>
            <p>Вы не заблокировали ни одного пользователя</p>
        </div>
    );

    return (
        <div className="settings-content accounts-list-settings">
            <p style={{fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 12px 16px'}}>
                Заблокированные пользователи не могут просматривать ваш профиль, писать вам и оставлять комментарии.
            </p>
            {users.map(u => (
                <div key={u.id} className="account-card">
                    <div className="account-card-left">
                        <div className="avatar" style={{width: 40, height: 40, fontSize: 18}}>{u.avatar || "👤"}</div>
                        <div className="account-card-info">
                            <span className="acc-name">{u.displayName}</span>
                            <span className="acc-handle">@{u.username}</span>
                        </div>
                    </div>
                    <button 
                        className="settings-save-btn secondary" 
                        style={{width: 'auto', padding: '6px 16px', margin: 0, fontSize: 13}}
                        onClick={() => handleUnblock(u.id, u.username)}
                    >
                        Разблокировать
                    </button>
                </div>
            ))}
            {hasMore && (
                <button className="settings-save-btn secondary" onClick={() => loadUsers(page + 1)} disabled={loading}>
                    {loading ? 'Загрузка...' : 'Показать ещё'}
                </button>
            )}
        </div>
    );
};

export default BlockedUsersSettings;