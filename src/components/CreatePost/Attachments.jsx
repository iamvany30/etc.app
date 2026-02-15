import React from 'react';

const CloseIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>);

const Attachments = ({ attachments, onRemove, isUploading, uploadStatus }) => {
    if (attachments.length === 0 && !isUploading) return null;

    return (
        <div className="create-post-attachments">
            {attachments.length > 0 && (
                <div className="attachments-preview">
                    {attachments.map(att => {
                        const mime = att.mimeType || att.type || '';
                        const isVid = mime.startsWith('video/') || att.url.toLowerCase().endsWith('.mp4');

                        return (
                            <div key={att.id} className="attachment-item">
                                {isVid ? (
                                    <video src={att.url} className="create-post-media-preview" controls muted playsInline />
                                ) : (
                                    <img src={att.url} alt="media" />
                                )}
                                <button className="remove-att-btn" onClick={() => onRemove(att.id)}>
                                    <CloseIcon />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {isUploading && (
                <div className="upload-progress-container">
                    <div className="upload-progress-info">
                        <div className="upload-spinner-mini"></div>
                        <span>{uploadStatus || 'Загрузка...'}</span>
                    </div>
                    <div className="upload-progress-track">
                        <div className="upload-progress-fill-infinite"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attachments;