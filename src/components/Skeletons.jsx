
import React from 'react';
import '../styles/Skeleton.css';

const Shimmer = ({ className, style }) => (
    <div className={`skeleton-base ${className || ''}`} style={style} />
);


export const PostSkeleton = () => (
    <div className="skeleton-post">
        <Shimmer className="skeleton-avatar" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{display: 'flex', gap: 10, marginBottom: 6}}>
                <Shimmer className="skeleton-text w-30" />
                <Shimmer className="skeleton-text w-20" />
            </div>
            <Shimmer className="skeleton-text w-90" />
            <Shimmer className="skeleton-text w-60" />
            <Shimmer className="skeleton-rect" style={{ height: '200px', marginTop: '10px' }} />
            {}
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12, maxWidth: '80%'}}>
                <Shimmer className="skeleton-text" style={{width: 30, height: 16}} />
                <Shimmer className="skeleton-text" style={{width: 30, height: 16}} />
                <Shimmer className="skeleton-text" style={{width: 30, height: 16}} />
            </div>
        </div>
    </div>
);


export const TrackSkeleton = () => (
    <div className="skeleton-track">
        <Shimmer className="skeleton-cover" />
        <div style={{ flex: 1 }}>
            <Shimmer className="skeleton-text w-40" style={{ marginBottom: '6px' }} />
            <Shimmer className="skeleton-text w-30" />
        </div>
    </div>
);


export const ProfileSkeleton = () => (
    <div className="profile-skeleton">
        {}
        <Shimmer className="profile-skeleton-header" />
        
        <div className="profile-skeleton-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-60px' }}>
                <Shimmer className="skeleton-avatar-lg" />
                <div className="profile-skeleton-actions">
                    <Shimmer style={{ width: '100px', height: '36px', borderRadius: '99px' }} />
                </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
                <Shimmer className="skeleton-title w-40" style={{ height: '24px' }} />
                <Shimmer className="skeleton-text w-30" />
            </div>
            
            <div style={{ marginTop: '16px' }}>
                <Shimmer className="skeleton-text w-80" />
                <Shimmer className="skeleton-text w-60" />
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                <Shimmer className="skeleton-text w-20" />
                <Shimmer className="skeleton-text w-20" />
            </div>
        </div>
    </div>
);


export const NotificationSkeleton = () => (
    <div className="skeleton-notification">
        <Shimmer className="skeleton-avatar" />
        <div style={{ flex: 1 }}>
            <Shimmer className="skeleton-text w-60" />
            <Shimmer className="skeleton-text w-40" />
        </div>
    </div>
);


export const WidgetSkeleton = () => (
    <div className="skeleton-widget">
        <Shimmer className="skeleton-title w-50" />
        <div className="skeleton-widget-row">
            <Shimmer className="skeleton-avatar" style={{width: 36, height: 36}} />
            <div style={{flex: 1}}>
                <Shimmer className="skeleton-text w-60" />
                <Shimmer className="skeleton-text w-40" />
            </div>
        </div>
        <div className="skeleton-widget-row">
            <Shimmer className="skeleton-avatar" style={{width: 36, height: 36}} />
            <div style={{flex: 1}}>
                <Shimmer className="skeleton-text w-70" />
                <Shimmer className="skeleton-text w-30" />
            </div>
        </div>
        <div className="skeleton-widget-row">
            <Shimmer className="skeleton-avatar" style={{width: 36, height: 36}} />
            <div style={{flex: 1}}>
                <Shimmer className="skeleton-text w-50" />
                <Shimmer className="skeleton-text w-40" />
            </div>
        </div>
    </div>
);


export const ExploreSkeleton = () => (
    <div className="explore-skeleton">
        {}
        <div style={{ padding: '20px 16px 10px' }}>
            <Shimmer className="skeleton-title w-30" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                        <Shimmer className="skeleton-avatar" style={{ width: '64px', height: '64px', marginBottom: '8px' }} />
                        <Shimmer className="skeleton-text w-80" style={{ height: '10px' }} />
                    </div>
                ))}
            </div>
        </div>

        <div style={{ height: '8px', background: 'var(--color-border-light)', margin: '10px 0' }} />

        {}
        <div style={{ padding: '16px' }}>
            <Shimmer className="skeleton-title w-40" style={{ marginBottom: '20px' }} />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Shimmer className="skeleton-text w-20" style={{ height: '10px', opacity: 0.5 }} />
                    <Shimmer className="skeleton-text w-60" style={{ height: '16px' }} />
                    <Shimmer className="skeleton-text w-30" style={{ height: '10px', opacity: 0.5 }} />
                </div>
            ))}
        </div>
    </div>
);