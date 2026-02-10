import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';


import ConfirmDeleteModal from './modals/ConfirmDeleteModal';
import ExternalLinkModal, { isTrustedLink } from './modals/ExternalLinkModal';


import Comment from './Comment';
import MusicPlayer from './MusicPlayer';
import MediaGrid from './MediaGrid';


import { LikeIcon, CommentIcon, RepostIcon, ViewIcon, SendIcon } from './icons/InteractionsIcons';
import { MoreIcon, ShareIcon, EditIcon, DeleteIcon, PinIcon } from './icons/MenuIcons';



const renderParsedText = (text, onLinkClick) => {
    if (!text) return null;

    const regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(#[\wа-яА-ЯёЁ]+)|(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
            return <a key={i} href={part} onClick={(e) => onLinkClick(e, part)} className="post-external-link">{part}</a>;
        }
        if (/^www\./.test(part)) {
            return <a key={i} href={`http://${part}`} onClick={(e) => onLinkClick(e, `http://${part}`)} className="post-external-link">{part}</a>;
        }
        if (part.startsWith('#')) {
            return <Link key={i} to={`/explore?q=${encodeURIComponent(part)}`} onClick={(e) => e.stopPropagation()} className="post-hashtag">{part}</Link>;
        }
        if (part.startsWith('@')) {
            const username = part.substring(1);
            return <Link key={i} to={`/profile/${username}`} onClick={(e) => e.stopPropagation()} className="post-mention">{part}</Link>;
        }
        return part;
    });
};

const TimeAgo = ({ dateStr }) => {
    const [time, setTime] = useState('');
    useEffect(() => {
        if (!dateStr) return;
        const calcTime = () => {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.round((now - date) / 1000);
            if (diff < 60) setTime(`${diff}с`);
            else if (diff < 3600) setTime(`${Math.floor(diff / 60)}м`);
            else if (diff < 86400) setTime(`${Math.floor(diff / 3600)}ч`);
            else setTime(date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
        };
        calcTime();
        const timer = setInterval(calcTime, 60000);
        return () => clearInterval(timer);
    }, [dateStr]);
    return <span className="post-time">{time}</span>;
};

const RepostQuote = ({ post }) => {
    const { openModal } = useModal();
    const navigate = useNavigate();

    const handleLinkClick = (e, url) => {
        e.preventDefault(); e.stopPropagation();
        if (isTrustedLink(url)) window.api.openExternalLink(url);
        else openModal(<ExternalLinkModal url={url} />);
    };

    if (!post) return null;
    
    return (
        <div 
            className="repost-quote" 
            onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
            style={{ cursor: 'pointer' }}
        >
            <div className="post-author-info">
                <div className="avatar" style={{width: 20, height: 20, fontSize: 12}}>{post.author?.avatar || "👤"}</div>
                <span className="post-author">{post.author?.displayName}</span>
                <span className="post-handle">@{post.author?.username}</span>
            </div>
            {post.content && <p className="post-content">{renderParsedText(post.content, handleLinkClick)}</p>}
            {post.attachments?.length > 0 && (
                <div className="post-media-container is-quote-media">
                    <MediaGrid attachments={post.attachments.slice(0, 1)} />
                </div>
            )}
        </div>
    );
};



const PostCard = ({ post }) => {
    const { currentUser } = useUser();
    const { openModal } = useModal();
    const navigate = useNavigate();
    const menuRef = useRef(null);
    const textareaRef = useRef(null);

    const [localPost, setLocalPost] = useState(post);
    const [isDeleted, setIsDeleted] = useState(false);
    const [liked, setLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isPinned, setIsPinned] = useState(post.isPinned || false);
    
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [commentsCount, setCommentsCount] = useState(post.commentsCount);

    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content || "");

    const isOwner = currentUser?.id === post.author?.id || post.isOwner;

    useEffect(() => {
        setLocalPost(post);
        setLiked(post.isLiked);
        setLikesCount(post.likesCount);
        setIsPinned(post.isPinned || false);
        setCommentsCount(post.commentsCount);
    }, [post]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    useLayoutEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            textareaRef.current.focus();
        }
    }, [isEditing]);

    const handleLinkClick = (e, url) => {
        e.preventDefault(); e.stopPropagation();
        if (isTrustedLink(url)) window.api.openExternalLink(url);
        else openModal(<ExternalLinkModal url={url} />);
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        const prevLiked = liked;
        setLiked(!prevLiked);
        setLikesCount(prev => !prevLiked ? prev + 1 : prev - 1);
        try { await apiClient.likePost(localPost.id); } 
        catch { setLiked(prevLiked); setLikesCount(prev => prevLiked ? prev + 1 : prev - 1); }
    };

    const handleShare = (e) => {
        e.stopPropagation();
        const url = `https://xn--d1ah4a.com/@${localPost.author?.username}/post/${localPost.id}`;
        navigator.clipboard.writeText(url).then(() => alert("Ссылка скопирована!")).catch(() => {});
        setShowMenu(false);
    };

    const handlePin = async (e) => {
        e.stopPropagation();
        const prevState = isPinned;
        setIsPinned(!prevState);
        setShowMenu(false);
        try { prevState ? await apiClient.unpinPost(localPost.id) : await apiClient.pinPost(localPost.id); } 
        catch { setIsPinned(prevState); }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        openModal(
            <ConfirmDeleteModal 
                onConfirm={async () => {
                    try {
                        await apiClient.deletePost(localPost.id);
                        setIsDeleted(true);
                    } catch (err) { console.error(err); }
                }} 
            />
        );
    };

    const handleEditSave = async (e) => {
        e.stopPropagation();
        if (!editContent.trim()) return;
        try {
            const res = await apiClient.editPost(localPost.id, editContent);
            if (res && !res.error) {
                setLocalPost(prev => ({ ...prev, content: editContent }));
                setIsEditing(false);
            }
        } catch (e) { console.error(e); }
    };

    const toggleComments = async (e) => {
        e.stopPropagation();
        const nextState = !showComments;
        setShowComments(nextState);
        if (nextState && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await apiClient.getPostDetails(localPost.id);
                setComments(res?.data?.comments || res?.comments || []);
            } catch (e) { console.error(e); }
            finally { setLoadingComments(false); }
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!newComment.trim()) return;
        try {
            const res = await apiClient.addComment(localPost.id, newComment);
            if (res && !res.error) {
                setComments(prev => [res, ...prev]);
                setNewComment("");
                setCommentsCount(prev => prev + 1);
            }
        } catch (e) { console.error(e); }
    };

    const handlePostClick = () => navigate(`/post/${localPost.id}`);

    if (isDeleted || !localPost) return null;
    
    
    const isMusicPost = localPost.content?.includes('#nowkie_music_track');
    let musicData = null;

    if (isMusicPost) {
        try {
            const artistMatch = localPost.content.match(/\[artist:(.+?)\]/);
            const titleMatch = localPost.content.match(/\[title:(.+?)\]/);
            
            
            let audioAttachment = localPost.attachments?.find(a => {
                const type = a.mimeType || a.type || '';
                return type.startsWith('audio/') || type === 'video/mpeg' || a.url.endsWith('.mp3');
            });

            
            let coverAttachment = null;
            if (audioAttachment && localPost.attachments) {
                
                
                coverAttachment = localPost.attachments.find(a => (a.mimeType || a.type || '').startsWith('image/'));
                
                
                if (!coverAttachment && localPost.attachments.length > 1) {
                    coverAttachment = localPost.attachments.find(a => a.id !== audioAttachment.id);
                }
            }

            if (artistMatch && titleMatch && audioAttachment) {
                musicData = {
                    id: localPost.id,
                    artist: decodeURIComponent(escape(atob(artistMatch[1]))),
                    title: decodeURIComponent(escape(atob(titleMatch[1]))),
                    src: audioAttachment.url,
                    cover: coverAttachment ? coverAttachment.url : null
                };
            }
        } catch (e) { console.error("Music parse error", e); }
    }

    return (
        <article className="post-container" onClick={handlePostClick}>
            <Link to={`/profile/${localPost.author?.username}`} onClick={e => e.stopPropagation()}>
                <div className="avatar">{localPost.author?.avatar || "👤"}</div>
            </Link>

            <div className="post-body">
                <header className="post-header">
                    <div className="post-header-info">
                        <Link to={`/profile/${localPost.author?.username}`} className="post-author" onClick={e => e.stopPropagation()}>
                            {localPost.author?.displayName}
                        </Link>
                        <span className="post-handle">
                            @{localPost.author?.username} · <TimeAgo dateStr={localPost.createdAt} />
                            {isPinned && <span className="pinned-badge"> 📌</span>}
                        </span>
                    </div>

                    <div className="post-menu-wrapper" ref={menuRef} onClick={e => e.stopPropagation()}>
                        <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
                            <MoreIcon />
                        </button>
                        {showMenu && (
                            <div className="post-dropdown-menu">
                                <button onClick={handleShare}><ShareIcon /> Поделиться</button>
                                {isOwner && (
                                    <>
                                        <button onClick={handlePin}>
                                            <PinIcon pinned={isPinned} /> {isPinned ? 'Открепить' : 'Закрепить'}
                                        </button>
                                        {!isMusicPost && ( 
                                            <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                                                <EditIcon /> Редактировать
                                            </button>
                                        )}
                                        <button className="delete-btn" onClick={handleDelete}>
                                            <DeleteIcon /> Удалить
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {isMusicPost && musicData ? (
                    
                    <div className="music-post-container" onClick={e => e.stopPropagation()}>
                        <MusicPlayer 
                            id={musicData.id}
                            artist={musicData.artist}
                            title={musicData.title}
                            src={musicData.src}
                            cover={musicData.cover}
                        />
                    </div>
                ) : isEditing ? (
                    
                    <div className="edit-mode-wrapper" onClick={e => e.stopPropagation()}>
                        <textarea 
                            ref={textareaRef}
                            className="edit-post-textarea"
                            value={editContent}
                            onChange={e => {
                                setEditContent(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            rows={1}
                        />
                        <div className="edit-actions">
                            <button className="cancel-btn" onClick={() => { setIsEditing(false); setEditContent(localPost.content || ""); }}>Отмена</button>
                            <button className="save-btn" onClick={handleEditSave}>Сохранить</button>
                        </div>
                    </div>
                ) : (
                    
                    <div>
                        {localPost.content && <p className="post-content">{renderParsedText(localPost.content, handleLinkClick)}</p>}
                        {localPost.originalPost && <RepostQuote post={localPost.originalPost} />}
                        <MediaGrid attachments={localPost.attachments} />
                    </div>
                )}

                <footer className="post-actions">
                    <button className={`action-btn comment ${showComments ? 'active' : ''}`} onClick={toggleComments}>
                        <span className="icon-wrapper"><CommentIcon /></span>
                        <span>{commentsCount}</span>
                    </button>
                    <button className={`action-btn repost ${localPost.isReposted ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
                        <span className="icon-wrapper"><RepostIcon /></span>
                        <span>{localPost.repostsCount}</span>
                    </button>
                    <button className={`action-btn like ${liked ? 'active' : ''}`} onClick={handleLike}>
                        <span className="icon-wrapper"><LikeIcon active={liked} /></span>
                        <span>{likesCount}</span>
                    </button>
                    <button className="action-btn view" onClick={e => e.stopPropagation()}>
                        <span className="icon-wrapper"><ViewIcon /></span>
                        <span>{localPost.viewsCount}</span>
                    </button>
                </footer>

                {showComments && (
                    <div className="comments-section" onClick={e => e.stopPropagation()}>
                        <form className="comment-form" onSubmit={handleSubmitComment}>
                            <div className="avatar" style={{width: 32, height: 32, fontSize: 16}}>
                                {currentUser?.avatar}
                            </div>
                            <input 
                                className="comment-input" 
                                placeholder="Ответить..." 
                                value={newComment} 
                                onChange={e => setNewComment(e.target.value)} 
                            />
                            <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}><SendIcon /></button>
                        </form>
                        {loadingComments ? (
                            <div className="comments-loading">Загрузка комментариев...</div>
                        ) : (
                            <div className="comments-list">
                                {comments.map(c => (
                                    <Comment 
                                        key={c.id} 
                                        comment={c} 
                                        postId={localPost.id} 
                                        onCommentAdded={(res) => {
                                            setComments(prev => [res, ...prev]);
                                            setCommentsCount(prev => prev + 1);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};

export default PostCard;