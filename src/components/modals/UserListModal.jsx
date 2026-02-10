import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useModal } from '../../context/ModalContext';
import '../../styles/UserListModal.css';

const UserListModal = ({ username, type, title }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { closeModal } = useModal();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = type === 'followers' 
                    ? await apiClient.getFollowers(username)
                    : await apiClient.getFollowing(username);
                
                const data = res?.users || res?.data?.users || [];
                setUsers(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [username, type]);

    return (
        <div className="user-list-modal">
            <div className="user-list-header">
                <h3>{title}</h3>
            </div>
            <div className="user-list-content">
                {loading ? (
                    <div className="loading-indicator">Загрузка...</div>
                ) : users.length > 0 ? (
                    users.map(user => (
                        <Link 
                            to={`/profile/${user.username}`} 
                            key={user.id} 
                            className="user-item"
                            onClick={closeModal}
                        >
                            <div className="avatar" style={{width: 40, height: 40, fontSize: 20}}>
                                {user.avatar || "👤"}
                            </div>
                            <div className="user-item-info">
                                <span className="display-name">{user.displayName}</span>
                                <span className="username">@{user.username}</span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="empty-state">Список пуст</div>
                )}
            </div>
        </div>
    );
};

export default UserListModal;