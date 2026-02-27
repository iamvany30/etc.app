/* @source src/pages/RecentPosts.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { historyUtils } from '../utils/historyUtils';
import PostCard from '../components/PostCard';
import { useModalStore } from '../store/modalStore';
import ConfirmActionModal from '../components/modals/ConfirmActionModal';
import { AltArrowLeft, History } from "@solar-icons/react";
import '../styles/Downloads.css'; 

const RecentPosts = () => {
    const navigate = useNavigate();
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    
    const [posts, setPosts] = useState([]);

    const loadHistory = () => {
        setPosts(historyUtils.getAll());
    };

    useEffect(() => {
        loadHistory();
        window.addEventListener('history-updated', loadHistory);
        return () => window.removeEventListener('history-updated', loadHistory);
    }, []);

    const handleClear = () => {
        openModal(
            <ConfirmActionModal 
                title="Очистить историю?"
                message="Вы уверены, что хотите удалить все недавние посты из истории?"
                confirmText="Очистить"
                onConfirm={() => {
                    historyUtils.clear();
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
    };

    return (
        <div className="downloads-page">
            <header className="dl-sticky-header">
                <div className="dl-header-left">
                    <button className="dl-back-btn" onClick={() => navigate(-1)}>
                        <AltArrowLeft size={24} />
                    </button>
                    <h2 className="dl-header-title">Недавние</h2>
                </div>
                {posts.length > 0 && (
                    <button className="dl-clear-history-btn" onClick={handleClear}>
                        Очистить
                    </button>
                )}
            </header>

            <div className="downloads-content content-fade-in" style={{ padding: 0 }}>
                {posts.length === 0 ? (
                    <div className="dl-empty-state">
                        <div className="dl-empty-icon" style={{ color: '#1d9bf0', borderColor: 'rgba(29, 155, 240, 0.2)', background: 'linear-gradient(135deg, rgba(29, 155, 240, 0.15), transparent)'}}>
                            <History size={48} variant="Bold" />
                        </div>
                        <h3>История пуста</h3>
                        <p>Здесь будут отображаться посты, которые вы недавно просмотрели в ленте.</p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={posts}
                        data-virtuoso-scroller="true"
                        itemContent={(index, post) => (
                            <PostCard 
                                post={post} 
                                key={post.id} 
                                disableHistory={true} 
                            />
                        )}
                        components={{ Footer: () => <div style={{ height: '140px' }} /> }}
                    />
                )}
            </div>
        </div>
    );
};

export default RecentPosts;