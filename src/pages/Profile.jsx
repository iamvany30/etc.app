import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';


import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';  
import EditProfileModal from '../components/modals/EditProfileModal';
import UserListModal from '../components/modals/UserListModal';
import BannerEditorModal from '../components/modals/BannerEditorModal';
import AvatarEditorModal from '../components/modals/AvatarEditorModal';
import { ProfileSkeleton, PostSkeleton } from '../components/Skeletons';


import { VerifiedBlue, VerifiedGold } from '../components/icons/VerifyIcons';
import '../styles/Profile.css';


const GOLD_VERIFIED_IDS = [
    '48f4cd67-58a2-4c0d-b1be-235fc4bb91a4'
];

const CameraIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

const Profile = () => {
    const { username } = useParams();
    const { currentUser, setCurrentUser } = useUser();
    const { openModal } = useModal();
    
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');  
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    const isMyProfile = currentUser?.username === username;

    const loadProfileData = useCallback(async () => {
        if (!username) return;
        setLoading(true);
        try {
            
            const profileRes = await apiClient.getProfile(username);
            const userData = profileRes?.data || profileRes?.user || profileRes;

            if (userData && (userData.id || userData.username)) {
                setUser(userData);
                setIsFollowing(userData.isFollowing);
                setFollowersCount(userData.followersCount || 0);
                
                
                setLoadingPosts(true);
                let postsRes = activeTab === 'posts' 
                    ? await apiClient.getUserPosts(username)
                    : await apiClient.getUserLikedPosts(username);
                
                setPosts(postsRes?.data?.posts || postsRes?.posts || []);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Ошибка профиля:", error);
            setUser(null);
        } finally {
            setLoading(false);
            setLoadingPosts(false);
        }
    }, [username, activeTab]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const handleFollowToggle = async () => {
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
    };

    const handleBannerUpdate = (newUrl) => {
        setUser(prev => ({ ...prev, banner: newUrl }));
        if (isMyProfile) setCurrentUser(prev => ({ ...prev, banner: newUrl }));
    };

    const handleAvatarUpdate = (newUrl) => {
        setUser(prev => ({ ...prev, avatar: newUrl }));
        if (isMyProfile) setCurrentUser(prev => ({ ...prev, avatar: newUrl }));
    };

    const handlePostCreated = (newPost) => {
        if (activeTab === 'posts') setPosts(prev => [newPost, ...prev]);
    };

    
    const openFollowers = () => openModal(<UserListModal username={username} type="followers" title="Читатели" />);
    const openFollowing = () => openModal(<UserListModal username={username} type="following" title="Читаемые" />);
    const openBannerEditor = () => openModal(<BannerEditorModal onSaveSuccess={handleBannerUpdate} />);
    const openAvatarEditor = () => openModal(<AvatarEditorModal onSaveSuccess={handleAvatarUpdate} />);
    const openEditProfile = () => openModal(<EditProfileModal />);

    if (loading) return (
        <div className="profile-page">
            <ProfileSkeleton />
            <div style={{padding: '16px'}}><PostSkeleton /></div>
        </div>
    );

    if (!user) return (
        <div className="empty-state" style={{marginTop: 100}}>
            <h2>Пользователь не найден</h2>
            <p>Такого аккаунта не существует или он был удален.</p>
        </div>
    );

    
    const hasGoldVerify = GOLD_VERIFIED_IDS.includes(user.id);
    const hasBlueVerify = user.verified && !hasGoldVerify;

    return (
        <div className="profile-page">
            
            <div className="profile-banner">
                {user.banner ? (
                    <img src={user.banner} alt="Banner" className="profile-banner__image" />
                ) : (
                    <div className="profile-banner__placeholder" />
                )}
                
                {isMyProfile && (
                    <button className="edit-banner-btn" onClick={openBannerEditor} title="Изменить обложку">
                        <CameraIcon />
                    </button>
                )}
            </div>

            
            <div className="profile-header-top">
                <div className="profile-avatar-wrapper">
                    {user.avatar && user.avatar.length > 4 ? (
                         <img src={user.avatar} alt={user.username} className="profile-avatar-img" />
                    ) : (
                        <div className="profile-avatar-placeholder">{user.avatar || "👤"}</div>
                    )}

                    {isMyProfile && (
                        <div className="edit-avatar-overlay" onClick={openAvatarEditor}>
                            <CameraIcon />
                        </div>
                    )}
                </div>
                
                <div className="profile-actions">
                    {isMyProfile ? (
                        <button className="profile-btn outline" onClick={openEditProfile}>Редактировать</button>
                    ) : (
                        <button 
                            className={`profile-btn ${isFollowing ? 'outline' : 'filled'}`} 
                            onClick={handleFollowToggle}
                        >
                            {isFollowing ? 'Читаю' : 'Читать'}
                        </button>
                    )}
                </div>
            </div>

            
            <div className="profile-details">
                <div className="profile-names">
                    <div className="profile-display-name-row">
                        <h1 className="profile-display-name">{user.displayName}</h1>
                        {hasGoldVerify && <VerifiedGold title="Официальный аккаунт" style={{marginLeft: 4}} />}
                        {hasBlueVerify && <VerifiedBlue title="Подтвержденный аккаунт" style={{marginLeft: 4}} />}
                    </div>
                    <span className="profile-username">@{user.username}</span>
                </div>

                {user.bio && <p className="profile-bio">{user.bio}</p>}

                <div className="profile-stats">
                    <button className="stat-item" onClick={openFollowing}>
                        <span className="stat-value">{user.followingCount || 0}</span>
                        <span className="stat-label">в читаемых</span>
                    </button>
                    <button className="stat-item" onClick={openFollowers}>
                        <span className="stat-value">{followersCount}</span>
                        <span className="stat-label">читателей</span>
                    </button>
                </div>
            </div>

            
            <nav className="profile-tabs">
                <button className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                    <span className="tab-content">Посты</span>
                </button>
                <button className={`profile-tab ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>
                    <span className="tab-content">Нравится</span>
                </button>
            </nav>

            
            <div className="profile-content">
                {isMyProfile && activeTab === 'posts' && (
                    <CreatePost onPostCreated={handlePostCreated} />
                )}

                <div className="post-list">
                    {loadingPosts ? (
                        <div style={{padding: '16px'}}><PostSkeleton /></div>
                    ) : posts.length > 0 ? (
                        posts.map((p, i) => <PostCard key={`${p.id}-${i}`} post={p} />)
                    ) : (
                        <div className="empty-state">
                            <h3>{activeTab === 'posts' ? 'Нет постов' : 'Нет отметок "Нравится"'}</h3>
                            <p style={{marginTop: 8, color: 'var(--color-text-secondary)'}}>
                                {activeTab === 'posts' 
                                    ? (isMyProfile ? 'Опубликуйте что-нибудь!' : 'Пользователь пока ничего не публиковал.')
                                    : 'Здесь появятся посты, которые вам понравились.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;