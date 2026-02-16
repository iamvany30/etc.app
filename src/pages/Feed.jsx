
import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import { FeedCache } from '../core/FeedCache'; 


import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { PostSkeleton } from '../components/Skeletons';


import '../styles/Feed.css';

const Feed = () => {
    const [tab, setTab] = useState('popular'); 
    
    
    const cachedData = FeedCache.get('popular');
    const [posts, setPosts] = useState(cachedData?.posts || []);
    
    const [loading, setLoading] = useState(!cachedData); 
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    
    const nextCursorRef = useRef(cachedData?.pagination?.nextCursor || null);
    const hasMoreRef = useRef(cachedData?.pagination?.hasMore ?? true);
    const isFetchingRef = useRef(false);
    
    
    const virtuosoRef = useRef(null);
    const scrollIndexRef = useRef(cachedData?.scrollIndex || 0);

    
    useEffect(() => {
        return () => {
            
            FeedCache.set(tab, { 
                posts, 
                pagination: { nextCursor: nextCursorRef.current, hasMore: hasMoreRef.current } 
            });
        };
    }, [posts, tab]);

    
    const handleRangeChanged = useCallback((range) => {
        if (range.startIndex !== undefined) {
            scrollIndexRef.current = range.startIndex;
            
            FeedCache.saveScroll(tab, range.startIndex);
        }
    }, [tab]);

    /**
     * Загрузка постов
     */
    const loadPosts = useCallback(async (isInitial = false) => {
        if (isFetchingRef.current || (!isInitial && !hasMoreRef.current)) return;
        
        isFetchingRef.current = true;
        
        
        if (isInitial && posts.length === 0) {
            setLoading(true);
            setError(null);
        } else if (!isInitial) {
            setLoadingMore(true);
        }
        
        const cursor = isInitial ? null : nextCursorRef.current;
        
        try {
            const res = await apiClient.getPosts(tab, cursor, 20);
            
            const responseData = res?.data || res;
            const newPosts = responseData?.posts || [];
            const pagination = responseData?.pagination;

            setPosts(prev => {
                const updatedList = isInitial ? newPosts : [...prev, ...newPosts];
                
                
                FeedCache.set(tab, {
                    posts: updatedList,
                    pagination: pagination,
                    scrollIndex: scrollIndexRef.current 
                });
                
                return updatedList;
            });

            if (pagination) {
                nextCursorRef.current = pagination.nextCursor;
                hasMoreRef.current = pagination.hasMore;
            } else {
                hasMoreRef.current = false;
            }
        } catch (err) {
            console.error("Ошибка загрузки ленты:", err);
            
            if (posts.length === 0) {
                setError("Не удалось загрузить данные.");
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [tab]); 

    /**
     * Смена вкладки
     */
    const handleTabChange = (newTab) => {
        if (tab === newTab) return;

        
        FeedCache.set(tab, {
            posts,
            pagination: { nextCursor: nextCursorRef.current, hasMore: hasMoreRef.current },
            scrollIndex: scrollIndexRef.current
        });

        
        const cached = FeedCache.get(newTab);
        setTab(newTab);

        if (cached) {
            
            setPosts(cached.posts);
            nextCursorRef.current = cached.pagination?.nextCursor;
            hasMoreRef.current = cached.pagination?.hasMore ?? true;
            scrollIndexRef.current = cached.scrollIndex || 0;
            setLoading(false);
            
            
            requestAnimationFrame(() => {
                virtuosoRef.current?.scrollToIndex({ index: cached.scrollIndex || 0, align: 'start' });
            });
        } else {
            
            setPosts([]);
            nextCursorRef.current = null;
            hasMoreRef.current = true;
            scrollIndexRef.current = 0;
            setLoading(true);
            loadPosts(true); 
        }
    };

    
    useEffect(() => {
        if (posts.length === 0) {
            loadPosts(true);
        }
    }, [loadPosts]); 

    const handlePostCreated = useCallback((newPost) => {
        setPosts(prev => {
            const updated = [newPost, ...prev];
            FeedCache.set(tab, { posts: updated }); 
            return updated;
        });
        virtuosoRef.current?.scrollToIndex({ index: 0, align: 'start', behavior: 'smooth' });
    }, [tab]);

    const Header = useMemo(() => () => (
        <>
            <header className="sticky-header">
                <div className="sticky-tabs">
                    <button
                        className={`sticky-tab-btn ${tab === 'popular' ? 'active' : ''}`}
                        onClick={() => handleTabChange('popular')}
                    >
                        Популярное
                    </button>
                    <button
                        className={`sticky-tab-btn ${tab === 'subscribed' ? 'active' : ''}`}
                        onClick={() => handleTabChange('subscribed')}
                    >
                        Подписки
                    </button>
                </div>
            </header>
            
            <CreatePost onPostCreated={handlePostCreated} />
            
            {loading && posts.length === 0 && (
                <div className="skeleton-list">
                    {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
            )}

            {!loading && posts.length === 0 && !error && (
                <div className="empty-state">
                    <h3>{tab === 'subscribed' ? 'Ваша лента пуста' : 'Ничего не найдено'}</h3>
                    <p>
                        {tab === 'subscribed' 
                            ? <>Посты от подписок появятся здесь. <Link to="/explore" className="empty-feed-link">Найти друзей</Link>.</>
                            : 'В этой ленте пока нет постов.'}
                    </p>
                </div>
            )}

            {error && !loading && posts.length === 0 && (
                <div className="feed-error">
                    <h3>Ошибка загрузки</h3>
                    <button className="retry-btn" onClick={() => loadPosts(true)}>Повторить</button>
                </div>
            )}
        </>
    ), [tab, loading, posts.length, error]); 

    const Footer = useMemo(() => () => {
        if (loadingMore) return <div style={{padding: '20px 0'}}><PostSkeleton /></div>;
        if (!hasMoreRef.current && posts.length > 0) {
            return (
                <div className="feed-end-message">
                    <span>✨</span>
                    <p>Вы всё просмотрели</p>
                </div>
            );
        }
        return <div style={{ height: '90px' }} />;
    }, [loadingMore, posts.length]);

    return (
        <div className="feed-page" style={{ height: '100%' }}>
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                data={posts}
                endReached={() => loadPosts(false)}
                overscan={1500} 
                initialTopMostItemIndex={scrollIndexRef.current} 
                rangeChanged={handleRangeChanged}
                data-virtuoso-scroller="true" 
                itemContent={(index, post) => (
                    <PostCard post={post} key={post.id || index} />
                )}
                components={{ Header, Footer }}
            />
        </div>
    );
};

export default Feed;