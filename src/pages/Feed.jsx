import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { PostSkeleton } from '../components/Skeletons';
import '../styles/Feed.css';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [tab, setTab] = useState('popular'); 
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(true);
    const isFetchingRef = useRef(false);
    const virtuosoRef = useRef(null);

    const loadPosts = useCallback(async (isInitial = false) => {
        if (isFetchingRef.current || (!isInitial && !hasMoreRef.current)) return;
        
        isFetchingRef.current = true;
        if (isInitial) {
            setLoading(true);
            setError(null);
        } else {
            setLoadingMore(true);
        }
        
        const cursor = isInitial ? null : nextCursorRef.current;
        
        try {
            console.log(`Загрузка постов для таба: ${tab}, курсор: ${cursor}`);
            const res = await apiClient.getPosts(tab, cursor, 20);
            
             
            const responseData = res?.data || res;
            const newPosts = responseData?.posts || [];
            const pagination = responseData?.pagination;

            if (isInitial) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            if (pagination) {
                nextCursorRef.current = pagination.nextCursor;
                hasMoreRef.current = pagination.hasMore;
            } else {
                hasMoreRef.current = false;
            }
        } catch (err) {
            console.error("Ошибка загрузки ленты:", err);
            setError("Не удалось загрузить данные. Проверьте подключение.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [tab]);

    useEffect(() => {
        nextCursorRef.current = null;
        hasMoreRef.current = true;
        setPosts([]); 
        loadPosts(true);
    }, [tab, loadPosts]);

    const handlePostCreated = useCallback((newPost) => {
        setPosts(prev => [newPost, ...prev]);
        virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    }, []);

     
    const Header = useMemo(() => () => (
        <div style={{ background: 'var(--color-background)', paddingBottom: '8px' }}>
            <header className="feed-tabs">
                <button
                    className={`feed-tab ${tab === 'popular' ? 'active' : ''}`}
                    onClick={() => setTab('popular')}
                >
                    <span className="tab-content">Популярное</span>
                </button>
                <button
                    className={`feed-tab ${tab === 'subscribed' ? 'active' : ''}`}
                    onClick={() => setTab('subscribed')}
                >
                    <span className="tab-content">Подписки</span>
                </button>
            </header>
            <CreatePost onPostCreated={handlePostCreated} />
            
            { }
            {loading && posts.length === 0 && (
                <div className="skeleton-list">
                    {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
            )}

            { }
            {!loading && posts.length === 0 && !error && (
                <div className="empty-state">
                    <h3>Здесь пока пусто</h3>
                    {tab === 'subscribed' ? (
                        <p>Подпишитесь на кого-нибудь в <Link to="/explore" className="empty-feed-link">Обзоре</Link></p>
                    ) : (
                        <p>Постов не найдено. Попробуйте позже.</p>
                    )}
                </div>
            )}

            {error && !loading && posts.length === 0 && (
                <div className="feed-error">
                    <p>{error}</p>
                    <button className="retry-btn" onClick={() => loadPosts(true)}>Повторить</button>
                </div>
            )}
        </div>
    ), [tab, loading, posts.length, error, handlePostCreated, loadPosts]);

const Footer = useMemo(() => () => {
    if (loadingMore) return <div style={{padding: '20px 0'}}><PostSkeleton /></div>;
    
    return (
        <div style={{ 
            paddingTop: '20px', 
            paddingBottom: '90px',  
            textAlign: 'center' 
        }}> 
            {!hasMoreRef.current && posts.length > 0 ? (
                <div className="feed-end-message" style={{ opacity: 0.3, fontSize: '13px' }}>
                    <span>✨</span> Вы просмотрели всё на сегодня
                </div>
            ) : (
                 
                <div style={{ height: '20px' }} />
            )}
        </div>
    );
}, [loadingMore, posts.length]);

    return (
        <div className="feed-page" style={{ height: '100%', position: 'relative' }}>
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }} 
                data={posts}
                endReached={() => loadPosts(false)}
                overscan={1200}
                 
                itemContent={(index, post) => (
                    <PostCard post={post} key={post.id || index} />
                )}
                components={{
                    Header: Header,
                    Footer: Footer
                }}
            />
        </div>
    );
};

export default Feed;