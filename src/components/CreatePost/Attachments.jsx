/* @source src/components/CreatePost/Attachments.jsx */
import React from 'react';
import { AttachmentCloseIcon } from '../icons/CustomIcons';
import { getCachedUrl } from '../../utils/assetHelper'; 

const UploadSpinner = () => (
    <div className="attachment-spinner-overlay">
        <div className="attachment-spinner"></div>
    </div>
);

const Attachments = ({ attachments, onRemove }) => {
    
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="attachments-preview">
            {attachments.map(att => {
                
                const isPending = att.status === 'pending';
                const key = isPending ? att.localId : (att.id || att.localId);
                
                
                let rawUrl = att.previewUrl || att.url || att.serverData?.url;
                
                
                let finalUrl = rawUrl;
                if (rawUrl && rawUrl.startsWith('http')) {
                    finalUrl = getCachedUrl(rawUrl);
                }
                
                
                const mime = (att.type || att.serverData?.mimeType || att.serverData?.type || (att.file ? att.file.type : '')).toLowerCase();
                const isVid = mime.startsWith('video/');

                return (
                    <div key={key} className={`attachment-item ${isPending ? 'pending' : ''}`}>
                        {isVid ? (
                            <video src={finalUrl} className="attachment-media" muted playsInline />
                        ) : (
                            <img src={finalUrl} alt="media" className="attachment-media" />
                        )}
                        
                        {}
                        {isPending && <UploadSpinner />}
                        
                        {}
                        <button className="remove-att-btn" onClick={(e) => {
                            e.preventDefault();
                            onRemove(key);
                        }}>
                            <AttachmentCloseIcon />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default Attachments;