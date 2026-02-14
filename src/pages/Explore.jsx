import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import PostCard from '../components/PostCard'; 
import { PostSkeleton } from '../components/Skeletons';
import '../styles/Explore.css';

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const Explore = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryFromUrl = searchParams.get('q') || "";

    const [searchQuery, setSearchQuery] = useState(queryFromUrl);
    const [trendsData, setTrendsData] = useState({ trending: [], clans: [] });
    
    
    const [searchResults, setSearchResults] = useState(null); 
    const [hashtagPosts, setHashtagPosts] = useState([]); 
    const [hashtagMeta, setHashtagMeta] = useState(null);  
    
    
    const [loadingTrends, setLoadingTrends] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    
    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(false);
    const isFetchingRef = useRef(false);
    const activeSearchRef = useRef(queryFromUrl);

    const isHashtagMode = searchQuery.trim().startsWith('#');

    
    useEffect(() => {
        let mounted = true;
        const loadTrends = async () => {
            if (trendsData.trending.length > 0) return; 
            
            setLoadingTrends(true);
            try {
                const [trendsRes, clansRes] = await Promise.all([
                    apiClient.getExplore(),
                    apiClient.getTopClans()
                ]);
                
                if (mounted) {
                    setTrendsData({
                        trending: trendsRes?.data?.hashtags || trendsRes?.hashtags || [],
                        clans: clansRes?.data?.clans || clansRes?.clans || [],
                    });
                }
            } catch (err) {
                console.error("Explore trends error:", err);
            } finally {
                if (mounted) setLoadingTrends(false);
            }
        };
        loadTrends();
        return () => { mounted = false; };
    }, []);

    
    const loadHashtagPosts = useCallback(async (isInitial = false) => {
        if (!searchQuery.startsWith('#') || isFetchingRef.current) return;
        if (!isInitial && !hasMoreRef.current) return;

        const currentTag = searchQuery.replace('#', '');
        if (!currentTag) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setLoadingMore(true); 
            setHashtagPosts([]);
            nextCursorRef.current = null;
        }

        try {
            const res = await apiClient.getHashtagPosts(currentTag, nextCursorRef.current);
            
            
            if (activeSearchRef.current !== searchQuery) return;

            const responseData = res?.data || res;
            const newPosts = responseData?.posts || [];
            const pagination = responseData?.pagination;

            if (isInitial) {
                setHashtagPosts(newPosts);
                setHashtagMeta(responseData?.hashtag || null);
            } else {
                setHashtagPosts(prev => [...prev, ...newPosts]);
            }

            nextCursorRef.current = pagination?.nextCursor || null;
            hasMoreRef.current = pagination?.hasMore || false;
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [searchQuery]);

    
    useEffect(() => {
        const query = searchQuery.trim();
        activeSearchRef.current = query;

        
        if (query.length <= 1) {
            setSearchResults(null);
            setHashtagPosts([]);
            setHashtagMeta(null);
            setIsSearching(false);
            if (queryFromUrl) setSearchParams({}, { replace: true });
            return;
        }

        const timer = setTimeout(async () => {
            setSearchParams({ q: query }, { replace: true });

            if (query.startsWith('#')) {
                
                setIsSearching(false); 
                loadHashtagPosts(true);
            } else {
                
                setIsSearching(true);
                try {
                    const res = await apiClient.search(query);
                    if (activeSearchRef.current === query) {
                        setSearchResults(res?.data || res);
                    }
                } catch (e) {
                    console.error("Search error:", e);
                } finally {
                    if (activeSearchRef.current === query) {
                        setIsSearching(false);
                    }
                }
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, setSearchParams, queryFromUrl, loadHashtagPosts]);

    

    const renderContent = () => {
        const isEmptyQuery = searchQuery.trim().length <= 1;

        
        if (isEmptyQuery) {
            if (loadingTrends) return <div className="loading-indicator">Загрузка трендов...</div>;
            
            return (
                <div className="explore-scroll-wrapper fade-in">
                    <section className="explore-section">
                        <h2 className="explore-section__title">Актуальное</h2>
                        {trendsData.trending.length > 0 ? trendsData.trending.map((tag, index) => (
                            <div key={tag.id || index} className="explore-item" onClick={() => setSearchQuery('#' + tag.name)}>
                                <span className="explore-item-rank">{index + 1}</span>
                                <div className="explore-item-info">
                                    <span className="explore-item-name">#{tag.name}</span>
                                    <span className="explore-item-meta">{tag.postsCount} постов</span>
                                </div>
                            </div>
                        )) : <div className="empty-state">Нет актуальных тем</div>}
                    </section>
                    
                    <section className="explore-section">
                        <h2 className="explore-section__title">Топ кланов</h2>
                        {trendsData.clans.length > 0 ? (
                            <div className="top-clans__list">
                                {trendsData.clans.map((clan, index) => (
                                    <div key={index} className={`clan-tag ${index < 3 ? 'top-3' : ''}`}>
                                        <span>{index + 1}. {clan.avatar}</span>
                                        <span style={{opacity: 0.7, marginLeft: 4}}>{clan.memberCount}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="empty-state">Кланы не найдены</div>}
                    </section>
                </div>
            );
        }

        
        if (isHashtagMode) {
            if (loadingMore && hashtagPosts.length === 0) {
                return (
                    <div className="explore-scroll-wrapper">
                        <div className="skeleton-list"><PostSkeleton /><PostSkeleton /></div>
                    </div>
                );
            }

            return (
                <Virtuoso
                    style={{ height: '100%' }} 
                    data={hashtagPosts}
                    endReached={() => loadHashtagPosts(false)}
                    itemContent={(index, post) => <PostCard post={post} key={post.id} />}
                    components={{
                        Header: () => (
                            <div className="explore-hashtag-header">
                                <h2 className="explore-section__title">#{searchQuery.replace('#', '')}</h2>
                                {hashtagMeta && (
                                    <div className="hashtag-stats-badge">
                                        Всего записей: <strong>{hashtagMeta.postsCount}</strong>
                                    </div>
                                )}
                            </div>
                        ),
                        Footer: () => hasMoreRef.current ? <div style={{padding: 20}}><PostSkeleton /></div> : <div style={{height: 100}} />
                    }}
                />
            );
        }

        
        if (isSearching) return <div className="loading-indicator">Поиск...</div>;
        
        return (
            <div className="explore-scroll-wrapper fade-in">
                <GlobalSearchResults results={searchResults} setSearchQuery={setSearchQuery} />
            </div>
        );
    };

    return (
        <div className="explore-container">
            <div className="explore-header">
                <div className="search-bar-wrapper">
                    <div className="search-icon-absolute"><SearchIcon /></div>
                    <input 
                        type="text" 
                        className="search-input"
                        placeholder="Поиск людей или #тегов"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="explore-content">
                {renderContent()}
            </div>
        </div>
    );
};

const GlobalSearchResults = ({ results, setSearchQuery }) => {
    if (!results) return null;
    
    const users = results.users || [];
    const hashtags = results.hashtags || [];

    if (users.length === 0 && hashtags.length === 0) {
        return <div className="empty-state">Ничего не найдено</div>;
    }

    return (
        <div className="search-results-global">
            {users.length > 0 && (
                <div className="search-group">
                    <h3 className="search-group-title">Люди</h3>
                    {users.map(user => (
                        <Link to={`/profile/${user.username}`} key={user.id} className="explore-item">
                            <div className="avatar" style={{width: 40, height: 40, marginRight: 12, fontSize: 20}}>{user.avatar || "👤"}</div>
                            <div className="explore-item-info">
                                <span className="explore-item-name">{user.displayName}</span>
                                <span className="explore-item-meta">@{user.username}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {hashtags.length > 0 && (
                <div className="search-group">
                    <h3 className="search-group-title">Темы</h3>
                    {hashtags.map(tag => (
                        <div key={tag.id} className="explore-item" onClick={() => setSearchQuery('#' + tag.name)}>
                            <div className="explore-item-info">
                                <span className="explore-item-name">#{tag.name}</span>
                                <span className="explore-item-meta">{tag.postsCount} постов</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Explore;