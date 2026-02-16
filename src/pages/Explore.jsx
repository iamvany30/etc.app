/* @source src/pages/Explore.jsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import PostCard from '../components/PostCard'; 
import { PostSkeleton, ExploreSkeleton, WidgetSkeleton } from '../components/Skeletons';
import '../styles/Explore.css';


const CACHE_KEY = 'itd_explore_data_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; 


const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const ClearIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const Explore = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryFromUrl = searchParams.get('q') || "";

    const [searchQuery, setSearchQuery] = useState(queryFromUrl);
    const [trendsData, setTrendsData] = useState({ trending: [], clans: [] });
    const [searchResults, setSearchResults] = useState(null); 
    const [hashtagPosts, setHashtagPosts] = useState([]); 
    
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true); 
    const [loadingMore, setLoadingMore] = useState(false);

    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(false);
    const isFetchingRef = useRef(false);
    const activeSearchRef = useRef(queryFromUrl);

    const isHashtagFeedMode = searchQuery.trim().startsWith('#');

    
    useEffect(() => {
        const loadInitialData = async () => {
            
            if (searchQuery) {
                setLoadingInitial(false);
                return;
            }

            
            try {
                const cachedRaw = localStorage.getItem(CACHE_KEY);
                if (cachedRaw) {
                    const { data, timestamp } = JSON.parse(cachedRaw);
                    const age = Date.now() - timestamp;

                    
                    if (age < CACHE_TTL) {
                        console.log(`[Explore] Loaded from cache (${Math.round(age / 1000 / 60)} min old)`);
                        setTrendsData(data);
                        setLoadingInitial(false);
                        return; 
                    }
                }
            } catch (e) {
                console.warn("[Explore] Cache parse error", e);
                localStorage.removeItem(CACHE_KEY);
            }

            
            try {
                const [trendsRes, clansRes] = await Promise.all([
                    apiClient.getExplore(),
                    apiClient.getTopClans()
                ]);

                const newData = {
                    trending: trendsRes?.data?.hashtags || trendsRes?.hashtags || [],
                    clans: clansRes?.data?.clans || clansRes?.clans || [],
                };

                setTrendsData(newData);

                
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    data: newData,
                    timestamp: Date.now()
                }));

            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoadingInitial(false); 
            }
        };

        loadInitialData();
    }, [searchQuery]);

    
    const loadHashtagFeed = useCallback(async (isInitial = false) => {
        if (!isHashtagFeedMode || isFetchingRef.current) return;
        if (!isInitial && !hasMoreRef.current) return;

        const tag = searchQuery.replace('#', '').trim();
        if (!tag) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setLoading(true);
            setHashtagPosts([]);
            nextCursorRef.current = null;
        } else {
            setLoadingMore(true);
        }

        try {
            const res = await apiClient.getHashtagPosts(tag, nextCursorRef.current);
            if (activeSearchRef.current !== searchQuery) return;

            const data = res?.data || res;
            const newPosts = data?.posts || [];
            
            setHashtagPosts(prev => isInitial ? newPosts : [...prev, ...newPosts]);
            nextCursorRef.current = data?.pagination?.nextCursor || null;
            hasMoreRef.current = !!data?.pagination?.hasMore;
        } catch (e) { console.error(e); } 
        finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [searchQuery, isHashtagFeedMode]);

    
    useEffect(() => {
        const query = searchQuery.trim();
        activeSearchRef.current = query;

        if (!query) {
            setSearchResults(null);
            setHashtagPosts([]);
            setSearchParams({}, { replace: true });
            return;
        }

        const timer = setTimeout(async () => {
            setSearchParams({ q: query }, { replace: true });

            if (query.startsWith('#')) {
                loadHashtagFeed(true);
            } else {
                setLoading(true);
                try {
                    const res = await apiClient.search(query);
                    if (activeSearchRef.current === query) {
                        setSearchResults(res?.data || res);
                    }
                } catch (e) { console.error(e); } 
                finally { if (activeSearchRef.current === query) setLoading(false); }
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery, setSearchParams, loadHashtagFeed]);

    
    const renderBody = () => {
        
        if (!searchQuery && loadingInitial) {
            return <ExploreSkeleton />;
        }

        
        if (!searchQuery.trim()) {
            return (
                <div className="explore-scroll-area content-fade-in">
                    {}
                    {trendsData.clans.length > 0 && (
                        <section className="clans-section">
                            <h3 className="explore-section-title">Топ сообществ</h3>
                            <div className="clans-horizontal-scroll">
                                {trendsData.clans.map((clan, idx) => (
                                    <div key={idx} className={`clan-card ${idx < 3 ? 'top-tier' : ''}`}>
                                        <div className="clan-avatar-ring">
                                            <div className="clan-avatar-inner">
                                                {clan.avatar}
                                            </div>
                                            <div className="clan-members-badge">
                                                {clan.memberCount}
                                            </div>
                                        </div>
                                        <span className="clan-name">{clan.name || 'Клан'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {}
                    <section className="trends-section">
                        <h3 className="explore-section-title">Актуальные темы</h3>
                        <div className="trends-list">
                            {trendsData.trending.map((tag, idx) => (
                                <div key={tag.id || idx} className="trend-item" onClick={() => setSearchQuery('#' + tag.name)}>
                                    <div className="trend-info">
                                        <div className="trend-category">
                                            <span>Тренды: итд.app</span>
                                            <span className="trend-dots">···</span>
                                        </div>
                                        <span className="trend-name">#{tag.name}</span>
                                        <span className="trend-count">{tag.postsCount} постов</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            );
        }

        
        if (isHashtagFeedMode) {
            return (
                <Virtuoso
                    style={{ height: '100%' }}
                    data={hashtagPosts}
                    endReached={() => loadHashtagFeed(false)}
                    itemContent={(index, post) => <PostCard post={post} key={post.id} />}
                    components={{
                        Header: () => loading ? <div className="p-16"><PostSkeleton /><PostSkeleton /></div> : null,
                        Footer: () => (
                            <div style={{ paddingBottom: '140px', paddingTop: '20px' }}>
                                {loadingMore && <PostSkeleton />}
                                {!hasMoreRef.current && hashtagPosts.length > 0 && <div className="end-msg">Больше постов нет</div>}
                            </div>
                        )
                    }}
                />
            );
        }

        
        return (
            <div className="explore-scroll-area">
                {loading ? (
                    <div style={{padding: 16}}>
                        <WidgetSkeleton /> 
                    </div>
                ) : (
                    <GlobalResultsList results={searchResults} onTagClick={(t) => setSearchQuery('#' + t)} />
                )}
            </div>
        );
    };

    return (
        <div className="explore-page">
            <div className="sticky-header">
                <div className="explore-search-container">
                    <div className="search-input-wrapper">
                        <div className="search-icon-left"><SearchIcon /></div>
                        <input 
                            type="text" 
                            className="explore-input"
                            placeholder="Поиск людей или #тегов"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                                <ClearIcon />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="explore-content-container">
                {renderBody()}
            </div>
        </div>
    );
};

const GlobalResultsList = ({ results, onTagClick }) => {
    if (!results) return null;
    const users = results.users || [];
    const hashtags = results.hashtags || [];

    if (users.length === 0 && hashtags.length === 0) {
        return <div className="notif-empty-state">Ничего не найдено</div>;
    }

    return (
        <div className="search-results-list content-fade-in">
            {users.length > 0 && (
                <div className="search-group">
                    <h4 className="search-group-header">Люди</h4>
                    {users.map(u => (
                        <Link to={`/profile/${u.username}`} key={u.id} className="search-result-item">
                            <div className="avatar" style={{width: 44, height: 44, fontSize: 20}}>
                                {u.avatar || "👤"}
                            </div>
                            <div className="res-info">
                                <span className="res-name">{u.displayName}</span>
                                <span className="res-sub">@{u.username}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {hashtags.length > 0 && (
                <div className="search-group">
                    <h4 className="search-group-header">Темы</h4>
                    {hashtags.map(t => (
                        <div key={t.id} className="search-result-item" onClick={() => onTagClick(t.name)}>
                            <div className="res-info">
                                <span className="res-name">#{t.name}</span>
                                <span className="res-sub">{t.postsCount} постов</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div style={{ height: '140px' }} />
        </div>
    );
};

export default Explore;