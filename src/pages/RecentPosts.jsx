/* @source src/pages/RecentPosts.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { historyUtils } from '../utils/historyUtils';
import PostCard from '../components/PostCard';
import { useModalStore } from '../store/modalStore';
import ConfirmActionModal from '../components/modals/ConfirmActionModal';
import { AltArrowLeft, History, Magnifer, CloseCircle } from "@solar-icons/react";
import Fuse from 'fuse.js'; 
import '../styles/Downloads.css'; 

const RecentPosts = () => {
    const navigate = useNavigate();
    const openModal = useModalStore(state => state.openModal);
    const closeModal = useModalStore(state => state.closeModal);
    
    const [posts, setPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); 

    const loadHistory = () => {
        setPosts(historyUtils.getAll());
    };

    useEffect(() => {
        loadHistory();
        window.addEventListener('history-updated', loadHistory);
        return () => window.removeEventListener('history-updated', loadHistory);
    }, []);

    
    const fuse = useMemo(() => new Fuse(posts, {
        keys: ['content', 'author.displayName', 'author.username'],
        threshold: 0.3,
        ignoreLocation: true
    }), [posts]);

    
    const displayPosts = useMemo(() => {
        if (!searchQuery.trim()) return posts;
        return fuse.search(searchQuery).map(result => result.item);
    }, [searchQuery, posts, fuse]);

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
                <div className="dl-header-left" style={{ flex: 1 }}>
                    <button className="dl-back-btn" onClick={() => navigate(-1)} style={{ flexShrink: 0 }}>
                        <AltArrowLeft size={24} />
                    </button>
                    
                    {}
                    <div className="dl-search-wrapper">
                        <Magnifer size={18} className="dl-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Поиск по истории..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="dl-search-clear" onClick={() => setSearchQuery('')}>
                                <CloseCircle size={18} variant="Bold" />
                            </button>
                        )}
                    </div>
                </div>
                {posts.length > 0 && !searchQuery && (
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
                ) : displayPosts.length === 0 ? (
                    <div className="dl-empty-state">
                        <Magnifer size={48} color="var(--color-text-secondary)" style={{marginBottom: 16, opacity: 0.5}} />
                        <h3>Ничего не найдено</h3>
                        <p>По вашему запросу «{searchQuery}» ничего не найдено в истории.</p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={displayPosts} 
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