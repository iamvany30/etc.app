
import React from 'react';


const CloseIcon = () => (<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42-1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"></path></svg>);


const UploadSpinner = () => (
    <div className="attachment-spinner-overlay">
        <div className="attachment-spinner"></div>
    </div>
);

const Attachments = ({ attachments, onRemove }) => {
    
    if (attachments.length === 0) return null;

    return (
        <div className="attachments-preview">
            {attachments.map(att => {
                
                const isPending = att.status === 'pending';
                const previewUrl = isPending ? att.previewUrl : att.url;
                const key = isPending ? att.localId : att.id;
                
                
                const mime = att.type || (att.file ? att.file.type : '');
                const isVid = mime.startsWith('video/');

                return (
                    <div key={key} className="attachment-item">
                        {isVid ? (
                            <video src={previewUrl} className="attachment-media" muted playsInline />
                        ) : (
                            <img src={previewUrl} alt="media" className="attachment-media" />
                        )}
                        
                        {}
                        {isPending && <UploadSpinner />}
                        
                        {}
                        <button className="remove-att-btn" onClick={() => onRemove(key)}>
                            <CloseIcon />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default Attachments;