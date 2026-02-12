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
    const queryParam = searchParams.get('q') || "";

    const [searchQuery, setSearchQuery] = useState(queryParam);
    const [data, setData] = useState({ trending: [], clans: [], users: [] });
    
     
    const [searchResults, setSearchResults] = useState(null); 
    const [hashtagPosts, setHashtagPosts] = useState([]); 
    const [hashtagMeta, setHashtagMeta] = useState(null);  
    
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

     
    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(false);
    const isFetchingRef = useRef(false);

    const isHashtagMode = searchQuery.trim().startsWith('#');

     
    useEffect(() => {
        const loadDefaultData = async () => {
            setLoading(true);
            try {
                const [trendingRes, clansRes, usersRes] = await Promise.all([
                    apiClient.getExplore(),
                    apiClient.getTopClans(),
                    apiClient.getSuggestions()
                ]);
                setData({
                    trending: trendingRes?.data?.hashtags || [],
                    clans: clansRes?.clans || [],
                    users: usersRes?.users || [],
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadDefaultData();
    }, []);

     
    const loadHashtagPosts = useCallback(async (isInitial = false) => {
        if (!isHashtagMode || isFetchingRef.current) return;
        if (!isInitial && !hasMoreRef.current) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setIsSearching(true);
            setHashtagPosts([]);
            nextCursorRef.current = null;
        } else {
            setLoadingMore(true);
        }

        try {
            const res = await apiClient.getHashtagPosts(searchQuery, nextCursorRef.current);
            const responseData = res?.data || res;
            const newPosts = responseData?.posts || [];
            const pagination = responseData?.pagination;
            const meta = responseData?.hashtag;  

            if (isInitial) {
                setHashtagPosts(newPosts);
                if (meta) setHashtagMeta(meta);
            } else {
                setHashtagPosts(prev => [...prev, ...newPosts]);
            }

            if (pagination) {
                nextCursorRef.current = pagination.nextCursor;
                hasMoreRef.current = pagination.hasMore;
            } else {
                hasMoreRef.current = false;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [searchQuery, isHashtagMode]);

     
    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim().length <= 1) {
                setSearchResults(null);
                setHashtagPosts([]);
                setHashtagMeta(null);
                return;
            }

            if (isHashtagMode) {
                loadHashtagPosts(true);
            } else {
                setIsSearching(true);
                try {
                    const res = await apiClient.search(searchQuery);
                    setSearchResults(res?.data || res);
                    setHashtagPosts([]);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            }
        };

        const timer = setTimeout(() => {
            if (searchQuery !== queryParam) {
                setSearchParams(searchQuery ? { q: searchQuery } : {}, { replace: true });
            }
            performSearch();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, isHashtagMode, loadHashtagPosts]);

     
    const HashtagHeader = useMemo(() => () => (
        <div className="explore-hashtag-results-header">
            <h2 className="explore-section__title">
                Результаты по тегу {searchQuery}
            </h2>
            {hashtagMeta && (
                <div className="hashtag-stats-badge">
                    Всего постов: <strong>{hashtagMeta.postsCount?.toLocaleString()}</strong>
                </div>
            )}
            {isSearching && hashtagPosts.length === 0 && (
                <div className="skeleton-list">
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}
        </div>
    ), [searchQuery, hashtagMeta, isSearching, hashtagPosts.length]);

    const HashtagFooter = () => {
        if (loadingMore) return <div style={{padding: 20}}><PostSkeleton /></div>;
        if (!hasMoreRef.current && hashtagPosts.length > 0) return (
            <div className="feed-end-message">Вы просмотрели все посты по этому тегу</div>
        );
        return <div style={{ height: 100 }} />;
    };

     
    const renderContent = () => {
        if (searchQuery.trim().length <= 1) {
            return loading ? <div className="loading-indicator">Загрузка...</div> : <DefaultExploreContent data={data} setSearchQuery={setSearchQuery} />;
        }

        if (isHashtagMode) {
            return (
                <Virtuoso
                    style={{ height: 'calc(100vh - 80px)' }}
                    data={hashtagPosts}
                    endReached={() => loadHashtagPosts(false)}
                    overscan={1000}
                    itemContent={(index, post) => <PostCard post={post} key={post.id} />}
                    components={{
                        Header: HashtagHeader,
                        Footer: HashtagFooter
                    }}
                />
            );
        }

         
        return <GlobalSearchResults results={searchResults} isSearching={isSearching} setSearchQuery={setSearchQuery} />;
    };

    return (
        <div className="explore-container">
            <div className="explore-header">
                <div className="search-bar-wrapper">
                    <div className="search-icon-absolute"><SearchIcon /></div>
                    <input 
                        type="text" 
                        className="search-input"
                        placeholder="Поиск по людям и темам"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

 
const DefaultExploreContent = ({ data, setSearchQuery }) => (
    <>
        <section className="explore-section">
            <h2 className="explore-section__title">Актуальные темы</h2>
            {data.trending.map((tag, index) => (
                <div 
                    key={tag.id} 
                    className="explore-item"
                    onClick={() => setSearchQuery('#' + tag.name)}
                >
                    <span className="explore-item-rank">{index + 1}</span>
                    <div className="explore-item-info">
                        <span className="explore-item-name">#{tag.name}</span>
                        <span className="explore-item-meta">{tag.postsCount?.toLocaleString()} постов</span>
                    </div>
                </div>
            ))}
        </section>

        <section className="explore-section">
            <h2 className="explore-section__title">Топ кланов</h2>
            <div className="top-clans__list">
                {data.clans.map((clan, index) => (
                    <div key={index} className={`clan-tag ${index < 3 ? 'top-3' : ''}`}>
                        <span>{index + 1}. {clan.avatar}</span>
                        <span style={{opacity: 0.7, marginLeft: 4}}>{clan.memberCount}</span>
                    </div>
                ))}
            </div>
        </section>
    </>
);

const GlobalSearchResults = ({ results, isSearching, setSearchQuery }) => {
    if (isSearching) return <div className="loading-indicator">Поиск...</div>;
    if (!results) return null;
    
    const { users, hashtags } = results;
    if (!users?.length && !hashtags?.length) return <div className="empty-state">Ничего не найдено</div>;

    return (
        <div>
            {users?.map(user => (
                <Link to={`/profile/${user.username}`} key={user.id} className="explore-item">
                    <div className="avatar" style={{width: 40, height: 40, marginRight: 12, fontSize: 20}}>{user.avatar}</div>
                    <div className="explore-item-info">
                        <span className="explore-item-name">{user.displayName}</span>
                        <span className="explore-item-meta">@{user.username}</span>
                    </div>
                </Link>
            ))}
            {hashtags?.map(tag => (
                <div 
                    key={tag.id} 
                    className="explore-item"
                    onClick={() => setSearchQuery('#' + tag.name)} 
                >
                    <div className="explore-item-info">
                        <span className="explore-item-name">#{tag.name}</span>
                        <span className="explore-item-meta">{tag.postsCount} постов</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Explore;