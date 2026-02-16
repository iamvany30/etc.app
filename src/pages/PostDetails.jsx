/* @source src/pages/PostDetails.jsx */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/Skeletons';
import '../styles/PostDetails.css';

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    
    const highlightCommentId = location.hash.includes('comment-') 
        ? location.hash.split('comment-')[1] 
        : null;

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const res = await apiClient.getPostDetails(id);
                const data = res?.data || res;
                if (data && !data.error) {
                    setPost(data);
                }
            } catch (e) {
                console.error("Ошибка загрузки поста:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    
    if (loading) {
        return (
            <div className="post-details-page">
                <header className="post-details-header">
                    <button className="back-btn" onClick={() => navigate(-1)} style={{opacity: 0.5}}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h2 className="header-title">Пост</h2>
                </header>
                
                {}
                <PostSkeleton />
                
                {}
                <div style={{ padding: '0', marginTop: '1px' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="skeleton-text" style={{width: '30%', height: '14px', borderRadius: '4px'}} />
                    </div>
                    <PostSkeleton />
                </div>
            </div>
        );
    }

    if (!post) return <div className="empty-state">Пост не найден или был удален</div>;

    return (
        <div className="post-details-page content-fade-in">
            <header className="post-details-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <h2 className="header-title">Пост</h2>
            </header>
            
            <PostCard 
                post={post} 
                key={post.id} 
                initialShowComments={!!highlightCommentId}
                highlightCommentId={highlightCommentId}
            />
            
            <div style={{height: '100px'}} />
        </div>
    );
};

export default PostDetails;