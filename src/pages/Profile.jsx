/* @source src/pages/Profile.jsx */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { apiClient } from '../api/client';
import { useUserStore } from '../store/userStore';
import { useModalStore } from '../store/modalStore';
import { useIslandStore } from '../store/islandStore';
import { useItdPlusStore } from '../store/itdPlusStore';
import { getAverageColor } from '../utils/colorUtils'; 
import { useFormatNumber } from '../hooks/useFormatNumber'; 

import PostCard from '../components/PostCard';
import { DynamicComponent } from '../core/ComponentRegistry';
import CreatePostFallback from '../components/CreatePost';
import EditProfileModal from '../components/modals/EditProfileModal';
import SettingsModal from '../components/modals/SettingsModal';
import UserListModal from '../components/modals/UserListModal';
import BannerEditorModal from '../components/modals/BannerEditorModal';
import { ProfileSkeleton, PostSkeleton } from '../components/Skeletons';
import Tooltip from '../components/Tooltip'; 

import { CameraIcon, SettingsIcon, CalendarIcon } from '../components/icons/CommonIcons';
import VerifiedBadgeWithTooltip from '../components/VerifiedBadgeWithTooltip';
import PinBadge from '../components/PinBadge';
import { ShieldCross, LockKeyhole } from "@solar-icons/react";
import { IconDownload, IconMusic, IconHistory } from '../components/icons/SidebarIcons'; 
import { BookmarkIcon } from '../components/icons/InteractionsIcons';
import ConfirmActionModal from '../components/modals/ConfirmActionModal';
import '../styles/Profile.css';

const GOLD_VERIFIED_IDS = ['48f4cd67-58a2-4c0d-b1be-235fc4bb91a4'];

function declension(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

const loadedBannersCache = new Set();

const BannerImage = React.memo(({ src, alt }) => {
    const [isLoaded, setIsLoaded] = useState(() => !!src && loadedBannersCache.has(src));

    useEffect(() => {
        if (src && !loadedBannersCache.has(src)) {
            setIsLoaded(false);
        } else if (src && loadedBannersCache.has(src)) {
            setIsLoaded(true);
        }
    }, [src]);

    const handleLoad = useCallback(() => {
        if (src) loadedBannersCache.add(src);
        setIsLoaded(true);
    }, [src]);

    return (
        <>
            <div className={`profile-banner-placeholder ${isLoaded ? 'hidden' : ''}`} />
            {src && (
                <img 
                    src={src} 
                    alt={alt} 
                    className={`profile-banner-img ${isLoaded ? 'loaded' : ''}`}
                    onLoad={handleLoad}
                />
            )}
        </>
    );
});

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const formatNumber = useFormatNumber();
    
    const currentUser = useUserStore(state => state.currentUser);
    const setCurrentUser = useUserStore(state => state.setCurrentUser);
    const openModal = useModalStore(state => state.openModal);
    const setIslandTheme = useIslandStore(state => state.setIslandTheme);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [deletedIds, setDeletedIds] = useState(new Set()); 
    const [pinnedPost, setPinnedPost] = useState(null);
    const [activeTab, setActiveTab] = useState('posts'); 
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    const [userPins, setUserPins] = useState([]);

    const nextCursorRef = useRef(null);
    const hasMoreRef = useRef(true);
    const isFetchingRef = useRef(false);
    const virtuosoRef = useRef(null);

    const userRef = useRef(null);
    const pinnedPostRef = useRef(null);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { pinnedPostRef.current = pinnedPost; }, [pinnedPost]);

    const isMyProfile = currentUser?.username === username;
    
    
    const verifiedUsersSet = useItdPlusStore(state => state.verifiedUsers);
    const isUserItdPlus = user ? (verifiedUsersSet.has(user.id) || verifiedUsersSet.has(user.username)) : false;

    const canPostOnWall = useMemo(() => {
        if (!user) return false;
        if (isMyProfile) return true;
        return user.canPost === true;
    }, [user, isMyProfile]);

    const displayPosts = useMemo(() => {
        let filtered = posts.filter(p => !deletedIds.has(p.id));
        if (activeTab !== 'posts') return filtered;
        
        const regularPosts = filtered.filter(p => p.id !== pinnedPost?.id);
        if (pinnedPost && !deletedIds.has(pinnedPost.id)) {
            return [pinnedPost, ...regularPosts];
        }
        return regularPosts;
    }, [posts, pinnedPost, activeTab, deletedIds]);
    
    const fetchProfile = useCallback(async () => {
        if (!username) return null;
        setLoadingProfile(true);
        try {
            const profileRes = await apiClient.getProfile(username);
            const userData = profileRes?.user || profileRes?.data || profileRes;

            if (userData && (userData.id || userData.username)) {
                const processedUser = {
                    ...userData,
                    isOnline: !!(userData.online || userData.isOnline),
                    lastSeen: userData.lastSeen || userData.last_seen || null,
                    showLastSeen: userData.showLastSeen !== false
                };
                
                setUser(processedUser);
                setIsFollowing(processedUser.isFollowing);
                setFollowersCount(processedUser.followersCount || 0);

                if (userData.pinnedPost && typeof userData.pinnedPost === 'object') {
                    setPinnedPost(userData.pinnedPost);
                } else if (userData.pinnedPostId === null) {
                    setPinnedPost(null);
                }

                if (processedUser.id === currentUser?.id) {
                    apiClient.getMyPins().then(pinsRes => {
                        if (pinsRes && pinsRes.data) {
                            setUserPins(pinsRes.data);
                        }
                    }).catch(e => console.error("Ошибка загрузки пинов:", e));
                }

                return processedUser;
            } else {
                setUser(null);
                setPinnedPost(null);
            }
        } catch (error) {
            setUser(null);
            setPinnedPost(null);
        } finally {
            setLoadingProfile(false);
        }
        return null;
    }, [username, currentUser?.id]);
    
    const loadPosts = useCallback(async (isInitial = false, forcePinnedId = undefined) => {
        if (!username) return;
        if (isFetchingRef.current || (!isInitial && !hasMoreRef.current)) return;

        isFetchingRef.current = true;
        if (isInitial) {
            setPosts([]);
            nextCursorRef.current = null;
            hasMoreRef.current = true;
        }

        try {
            const cursor = isInitial ? null : nextCursorRef.current;
            let res;
            if (activeTab === 'posts') {
                let pinnedId = forcePinnedId !== undefined ? forcePinnedId : 
                               (userRef.current?.pinnedPostId || userRef.current?.pinnedPost?.id || pinnedPostRef.current?.id || null);
                res = await apiClient.getUserPosts(username, cursor, 20, pinnedId);
            } else {
                res = await apiClient.getUserLikedPosts(username, cursor);
            }

            const responseData = res?.posts || res?.data?.posts || [];
            const pagination = res?.pagination || res?.data?.pagination;

            if (isInitial && activeTab === 'posts') {
                const foundPinned = responseData.find(p => p.isPinned === true);
                if (foundPinned) setPinnedPost(foundPinned);
            }

            setPosts(prev => {
                const list = isInitial ? responseData : [...prev, ...responseData];
                const uniqueIds = new Set();
                const uniquePosts = [];
                for (const post of list) {
                    if (!uniqueIds.has(post.id)) {
                        uniqueIds.add(post.id);
                        uniquePosts.push(post);
                    }
                }
                return uniquePosts;
            });

            if (pagination) {
                nextCursorRef.current = pagination.nextCursor;
                hasMoreRef.current = pagination.hasMore;
            } else {
                hasMoreRef.current = false;
            }
        } catch (e) {
            console.error(e);
        } finally {
            isFetchingRef.current = false;
        }
    }, [username, activeTab]);
    
    useEffect(() => {
        let isCancelled = false;
        const init = async () => {
            let fetchedUser = userRef.current;
            
            if (!fetchedUser || fetchedUser.username !== username) {
                fetchedUser = await fetchProfile();
            }
            
            if (!isCancelled) {
                const pId = fetchedUser?.pinnedPostId || fetchedUser?.pinnedPost?.id || null;
                await loadPosts(true, pId);
            }
        };
        init();
        return () => { isCancelled = true; };
    }, [username, activeTab, fetchProfile, loadPosts]);

    useEffect(() => {
        let isCancelled = false;
        const updateIslandColor = async () => {
            if (user?.banner) {
                const color = await getAverageColor(user.banner);
                if (!isCancelled && color) setIslandTheme(color);
            } else {
                if (!isCancelled) setIslandTheme(null);
            }
        };
        updateIslandColor();
        return () => {
            isCancelled = true;
            setIslandTheme(null);
        };
    }, [user?.banner, setIslandTheme]);

    const handleFollowToggle = useCallback(async () => {
        if (!user || isMyProfile) return;
        const prevState = isFollowing;
        const prevCount = followersCount;
        
        setIsFollowing(!prevState);
        setFollowersCount(prevState ? prevCount - 1 : prevCount + 1);
        
        try {
            if (prevState) await apiClient.unfollowUser(user.username);
            else await apiClient.followUser(user.username);
        } catch (e) {
            setIsFollowing(prevState);
            setFollowersCount(prevCount);
        }
    }, [user, isMyProfile, isFollowing, followersCount]);

    const handleBlockUser = () => {
        openModal(
            <ConfirmActionModal 
                title={`Заблокировать @${user.username}?`}
                message="Пользователь не сможет писать вам и просматривать ваш профиль."
                confirmText="Заблокировать"
                isDanger={true}
                onConfirm={async () => {
                    try {
                        await apiClient.blockUser(user.username);
                        showIslandAlert('success', 'Пользователь заблокирован', '🛡️');
                        navigate('/'); 
                    } catch (e) {
                        showIslandAlert('error', 'Ошибка блокировки', '❌');
                    }
                }}
            />
        );
    };

    const handleBannerUpdate = useCallback((newUrl) => {
        setUser(prev => ({ ...prev, banner: newUrl }));
        setCurrentUser(prev => prev.username === username ? { ...prev, banner: newUrl } : prev);
    }, [setCurrentUser, username]);
    
    const handlePostCreated = useCallback((newPost) => {
        setActiveTab(currentTab => {
            if (currentTab === 'posts') {
                setPosts(prev => {
                    if (prev.some(p => p.id === newPost.id)) return prev; 
                    return [newPost, ...prev];
                });
            }
            return currentTab;
        });
    }, []);

    const handleRemovePost = useCallback((postId) => {
        setDeletedIds(prev => new Set(prev).add(postId));
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (pinnedPostRef.current?.id === postId) {
            setPinnedPost(null);
        }
    }, []);

    const renderOnlineStatus = useCallback(() => {
        if (!user) return null;
        if (user.isOnline) return <div className="online-status-badge">В сети</div>;
        if (user.showLastSeen === false || !user.lastSeen) return <div className="offline-status-badge">Оффлайн</div>;

        const date = new Date(user.lastSeen);
        if (isNaN(date.getTime())) return <div className="offline-status-badge">Оффлайн</div>;

        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        let timeText = '';

        if (diffSeconds < 60) timeText = 'только что';
        else if (diffSeconds < 3600) {
            const m = Math.max(1, Math.floor(diffSeconds / 60));
            timeText = `${m} ${declension(m, ['минуту', 'минуты', 'минут'])} назад`;
        } else if (diffSeconds < 86400) { 
            const h = Math.floor(diffSeconds / 3600);
            timeText = `${h} ${declension(h, ['час', 'часа', 'часов'])} назад`;
        } else if (diffSeconds < 172800) timeText = 'вчера';
        else timeText = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

        return <div className="offline-status-badge">Был(а) {timeText}</div>;
    }, [user]);

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    };

    const ProfileHeader = useMemo(() => {
        if (!user) return null;
        
        const hasGoldVerify = GOLD_VERIFIED_IDS.includes(user.id);
        const hasBlueVerify = user.verified || user.isVerified;
        
        const isMutual = user.isFollowing && user.isFollowedBy;
        const followsYou = user.isFollowedBy && !user.isFollowing;
        const isPrivate = user.isPrivate || user.is_private;

        const formattedRegDate = formatDate(user.createdAt);
        const fullRegDate = user.createdAt 
            ? new Date(user.createdAt).toLocaleString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            : null;
        
        const activePinData = isMyProfile ? userPins.find(p => p.slug === user.activePin) : (user.activePin ? { name: "Активный пин" } : null);
        
        return (
            <div className="profile-header-container">
                {user.banner && (
                    <div className="profile-background-glow">
                        <img src={user.banner} alt="" aria-hidden="true" />
                        <div className="profile-glow-overlay" />
                    </div>
                )}

                <div className="profile-banner-group">
                    <div className="profile-banner">
                        <BannerImage src={user.banner} alt="Banner" />
                        <div className="profile-banner-fade" />
                        {isMyProfile && (
                            <button className="edit-banner-btn-modern" onClick={() => openModal(<BannerEditorModal onSaveSuccess={handleBannerUpdate} />)}>
                                <CameraIcon size={18} />
                                <span>Изменить обложку</span>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="profile-info-layer">
                    <div className="profile-avatar-row">
                        <div className="profile-avatar-main">
                            <div className="avatar" style={{ 
                                width: '100%', height: '100%', fontSize: '60px',
                                border: '6px solid var(--color-background)',
                                backgroundColor: 'var(--color-item-bg)'
                            }}>
                                {user.avatar || "👤"}
                            </div>
                            {user.isOnline && <div className="avatar-status-dot" />}
                        </div>
                        
                        <div className="profile-action-btns">
                            {isMyProfile ? (
                                <>
                                    <button className="btn-modern-outline" onClick={() => openModal(<EditProfileModal />)}>Изменить профиль</button>
                                    <button className="btn-modern-icon" onClick={() => openModal(<SettingsModal />)}><SettingsIcon size={20} /></button>
                                </>
                            ) : (
                                <>
                                    <button className={`btn-modern-follow ${isFollowing ? 'unfollow' : 'follow'}`} onClick={handleFollowToggle}>
                                        {isFollowing ? 'Вы читаете' : 'Читать'}
                                    </button>
                                    <button 
                                        className="btn-modern-icon" 
                                        style={{ color: '#f4212e', borderColor: 'rgba(244, 33, 46, 0.3)' }} 
                                        onClick={handleBlockUser} 
                                        title="Заблокировать"
                                    >
                                        <ShieldCross size={20} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-text-content">
                        <div className="profile-name-row">
                            <h1 className="profile-full-name">{user.displayName}</h1>
                            <div className="verify-badges">
                                {}
                                {hasGoldVerify && <VerifiedBadgeWithTooltip type="gold" size={24} />}
                                {hasBlueVerify && <VerifiedBadgeWithTooltip type="blue" size={24} />}
                                {isUserItdPlus && <VerifiedBadgeWithTooltip type="green" size={24} />}

                                <PinBadge 
                                    pin={activePinData || user.pin || user.activePin} 
                                    size={24} 
                                />
                            </div>
                            {renderOnlineStatus()}
                        </div>

                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                            <span className="profile-handle-text">@{user.username}</span>
                            
                            {isPrivate && (
                                <div className="private-profile-badge">
                                    <LockKeyhole size={14} /> 
                                    <span>Приватный профиль</span>
                                </div>
                            )}
                        </div>
                        
                        {(isMutual || followsYou) && (
                            <div className="profile-relationship">
                                {isMutual && <span className="rel-pill">Взаимная подписка</span>}
                                {followsYou && <span className="rel-pill">Читает вас</span>}
                            </div>
                        )}

                        {user.bio && <p className="profile-description">{user.bio}</p>}
                        
                        <div className="profile-meta-row">
                            {formattedRegDate && (
                                <Tooltip content={`Точная дата: ${fullRegDate}`}>
                                    <div className="meta-item">
                                        <CalendarIcon size={16} />
                                        <span>В сообществе с {formattedRegDate}</span>
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                        
                        <div className="profile-stats-row">
                            <button className="stat-link" onClick={() => openModal(<UserListModal username={username} type="following" title="Читаемые" />)}>
                                <strong>{formatNumber(user.followingCount || 0)}</strong> <span>читаемых</span>
                            </button>
                            <button className="stat-link" onClick={() => openModal(<UserListModal username={username} type="followers" title="Читатели" />)}>
                                <strong>{formatNumber(followersCount)}</strong> <span>читателей</span>
                            </button>
                            <span className="stat-text" title="Опубликовано постов">
                                <strong>{formatNumber(user.postsCount ?? user.stats?.posts ?? 0)}</strong> <span>постов</span>
                            </span>
                        </div>

                        {isMyProfile && (
                            <div className="profile-personal-menu">
                                <button className="personal-menu-btn" onClick={() => navigate('/bookmarks')}>
                                    <div className="icon-circle bookmark"><BookmarkIcon size={20} active={true} /></div>
                                    <div className="personal-btn-text"><span className="p-title">Закладки</span><span className="p-sub">Сохраненное</span></div>
                                </button>
                                <button className="personal-menu-btn" onClick={() => navigate('/recent')}>
                                    <div className="icon-circle" style={{background: 'rgba(29, 155, 240, 0.15)', color: '#1d9bf0'}}><IconHistory size={20} /></div>
                                    <div className="personal-btn-text"><span className="p-title">Недавние</span><span className="p-sub">Просмотренное</span></div>
                                </button>
                                <button className="personal-menu-btn" onClick={() => navigate('/downloads')}>
                                    <div className="icon-circle download"><IconDownload size={20} /></div>
                                    <div className="personal-btn-text"><span className="p-title">Загрузки</span><span className="p-sub">Файлы</span></div>
                                </button>
                                <button className="personal-menu-btn" onClick={() => navigate('/music')}>
                                    <div className="icon-circle music"><IconMusic size={20} /></div>
                                    <div className="personal-btn-text"><span className="p-title">Музыка</span><span className="p-sub">Библиотека</span></div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="profile-nav-tabs">
                    <button className={`nav-tab-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        <span>Посты</span>
                    </button>
                    <button className={`nav-tab-item ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>
                        <span>Нравится</span>
                    </button>
                </nav>

                {activeTab === 'posts' && (isMyProfile || canPostOnWall) && (
                    <div className="profile-create-wrap">
                        <DynamicComponent 
                            name="Components.CreatePost" 
                            fallback={CreatePostFallback} 
                            onPostCreated={handlePostCreated}
                            wallId={isMyProfile ? null : user.id}
                            placeholder={isMyProfile ? "Что нового?" : `Написать @${user.username}...`}
                        />
                    </div>
                )}
            </div>
        );
    }, [user, isMyProfile, isFollowing, followersCount, activeTab, username, openModal, handleBannerUpdate, handlePostCreated, renderOnlineStatus, navigate, canPostOnWall, handleFollowToggle, isUserItdPlus, formatNumber, userPins]);

    if (loadingProfile) {
        return (
            <div className="profile-page">
                <ProfileSkeleton />
                <div style={{padding: '0 16px', marginTop: 20}}>
                    <PostSkeleton />
                </div>
            </div>
        );
    }
    
    if (!user) return (
        <div className="empty-state" style={{marginTop: 100}}>
            <h2>Пользователь не найден</h2>
            <p>Аккаунт не существует или был удален.</p>
        </div>
    );

    return (
        <div className="profile-page content-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Virtuoso
                ref={virtuosoRef}
                className="custom-scroll-area profile-virtuoso-scroller"
                style={{ height: '100%', width: '100%' }}
                data={displayPosts}
                endReached={() => loadPosts(false)}
                overscan={1000}
                components={{
                    Header: () => ProfileHeader,
                    Footer: () => hasMoreRef.current && posts.length > 0 ? (
                        <div style={{padding: '0'}}><PostSkeleton /></div>
                    ) : (
                        <div style={{height: 140}} />
                    )
                }}
                itemContent={(index, post) => (
                    <PostCard 
                        post={post} 
                        key={post.id} 
                        isPinned={pinnedPost ? post.id === pinnedPost.id && activeTab === 'posts' : false} 
                        onDelete={() => handleRemovePost(post.id)} 
                    />
                )}
            />
        </div>
    );
};

export default Profile;