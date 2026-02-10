import React from 'react';
import '../styles/Skeleton.css';

const Shimmer = ({ className }) => <div className={`skeleton-base ${className}`} />;

export const PostSkeleton = () => (
    <div className="skeleton-post">
        <Shimmer className="skeleton-avatar" />
        <div style={{ flex: 1 }}>
            <Shimmer className="skeleton-title" />
            <Shimmer className="skeleton-text" />
            <Shimmer className="skeleton-text medium" />
            <Shimmer className="skeleton-rect" />
        </div>
    </div>
);

export const TrackSkeleton = () => (
    <div className="skeleton-track">
        <Shimmer className="skeleton-cover" />
        <div style={{ flex: 1 }}>
            <Shimmer className="skeleton-text" style={{ width: '120px', marginBottom: '6px' }} />
            <Shimmer className="skeleton-text short" />
        </div>
    </div>
);

export const ProfileSkeleton = () => (
    <div className="profile-skeleton">
        <Shimmer style={{ height: '200px', width: '100%' }} />
        <div style={{ padding: '16px' }}>
            <Shimmer className="skeleton-avatar" style={{ width: '120px', height: '120px', marginTop: '-60px', border: '4px solid var(--color-background)' }} />
            <Shimmer className="skeleton-title" style={{ marginTop: '16px' }} />
            <Shimmer className="skeleton-text medium" />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Shimmer className="skeleton-text" style={{ width: '60px' }} />
                <Shimmer className="skeleton-text" style={{ width: '60px' }} />
            </div>
        </div>
    </div>
);