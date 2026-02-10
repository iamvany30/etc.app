import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import PostCard from '../components/PostCard';

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

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
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading) return <div className="loading-indicator">Загрузка поста...</div>;
    if (!post) return <div className="empty-state">Пост не найден</div>;

    return (
        <div className="post-details-page">
            <header className="feed-tabs" style={{
                justifyContent: 'flex-start', 
                padding: '0 16px', 
                gap: '20px',
                alignItems: 'center',
                background: 'var(--color-background)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '1px solid var(--color-border)'
            }}>
                <button className="tool-btn" onClick={() => navigate(-1)} style={{
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%'
                }}>
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <h2 style={{fontSize: '18px', fontWeight: '800', margin: 0}}>Пост</h2>
            </header>
            
            <PostCard post={post} />
            
            <div style={{height: '100px'}} />
        </div>
    );
};

export default PostDetails;