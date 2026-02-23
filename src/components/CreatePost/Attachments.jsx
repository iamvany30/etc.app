import React from 'react';
import { AttachmentCloseIcon } from '../icons/CustomIcons';

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
                            <AttachmentCloseIcon />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default Attachments;