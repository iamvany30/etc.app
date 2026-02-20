import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { bookmarkUtils } from '../utils/bookmarkUtils';
import PostCard from '../components/PostCard';
import { NavBackIcon } from '../components/icons/CommonIcons';
import { IconBookmarks } from '../components/icons/SidebarIcons';
import '../styles/Feed.css'; 

const Bookmarks = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);

    const loadBookmarks = () => {
        setPosts(bookmarkUtils.getAll());
    };

    useEffect(() => {
        loadBookmarks();
        
        
        window.addEventListener('bookmarks-updated', loadBookmarks);
        return () => window.removeEventListener('bookmarks-updated', loadBookmarks);
    }, []);

    return (
        <div className="feed-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header className="sticky-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', height: '53px' }}>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <NavBackIcon />
                    </button>
                    <h2 className="header-title">Закладки</h2>
                </div>
            </header>

            {posts.length === 0 ? (
                <div className="empty-state">
                    <div style={{ 
                        width: 80, height: 80, borderRadius: '50%', 
                        background: 'var(--color-item-bg)', margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)'
                    }}>
                        <IconBookmarks size={40} />
                    </div>
                    <h3>Сохраняйте лучшее</h3>
                    <p>Здесь будут храниться посты, которые вы добавили в закладки. Они доступны только на этом устройстве.</p>
                </div>
            ) : (
                <Virtuoso
                    style={{ height: '100%' }}
                    data={posts}
                    data-virtuoso-scroller="true"
                    itemContent={(index, post) => (
                        <PostCard post={post} key={post.id} />
                    )}
                    components={{ Footer: () => <div style={{ height: 100 }} /> }}
                />
            )}
        </div>
    );
};

export default Bookmarks;