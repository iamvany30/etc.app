import React from 'react';
import { LinkPreviewCloseIcon } from '../icons/CustomIcons';

const LinkPreviewCard = ({ data, onRemove }) => {
    if (!data) return null;

    const { image, title, description, siteName, url } = data;

    
    const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    return (
        <div className="link-preview-card">
            <button className="remove-preview-btn" onClick={onRemove}>
                <LinkPreviewCloseIcon />
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