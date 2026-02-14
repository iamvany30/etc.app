import React from 'react';

const CloseIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>);

const LinkPreviewCard = ({ data, onRemove }) => {
    if (!data) return null;

    const { image, title, description, siteName, url } = data;

    
    const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    return (
        <div className="link-preview-card">
            <button className="remove-preview-btn" onClick={onRemove}>
                <CloseIcon />
            </button>
            {image && (
                <div className="preview-image-container">
                    <img src={image} alt="Preview" className="preview-image" />
                </div>
            )}
            <div className="preview-info">
                {siteName && <span className="preview-sitename">{siteName}</span>}
                <span className="preview-title">{title}</span>
                {description && <p className="preview-description">{description}</p>}
                <span className="preview-url">{displayUrl}</span>
            </div>
        </div>
    );
};

export default LinkPreviewCard;