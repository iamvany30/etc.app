/* @source src/components/modals/RemoteAnnouncementModal.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';
import { 
    AltArrowRight, 
    Copy, 
    InfoCircle, 
    DangerCircle, 
    Stars,
    Bell,
    Gift
} from "@solar-icons/react";
import '../../styles/RemoteAnnouncement.css';

const RemoteAnnouncementModal = ({ data, idKey }) => {
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    const navigate = useNavigate();

    const markAsSeen = () => {
        if (idKey) localStorage.setItem(idKey, 'true');
        closeModal();
    };

    const handleAction = (btn) => {
        switch (btn.action) {
            case 'external':
                if (window.api?.openExternalLink) window.api.openExternalLink(btn.payload);
                else window.open(btn.payload, '_blank');
                markAsSeen();
                break;
            case 'navigate':
                navigate(btn.payload);
                markAsSeen();
                break;
            case 'copy':
                navigator.clipboard.writeText(btn.payload);
                showIslandAlert('success', 'Скопировано!', '📋');
                break;
            case 'close':
            default:
                markAsSeen();
                break;
        }
    };

    const getHeaderIcon = () => {
        const size = 32;
        switch (data.type) {
            case 'party': return <Stars size={size} color="#FFD700" variant="Bold" />;
            case 'gift': return <Gift size={size} color="#FF0080" variant="Bold" />;
            case 'warning': return <DangerCircle size={size} color="#f4212e" variant="Bold" />;
            case 'update': return <AltArrowRight size={size} color="#00ba7c" variant="Bold" />;
            default: return <InfoCircle size={size} color="#1d9bf0" variant="Bold" />;
        }
    };

    return (
        <div className={`announcement-modal type-${data.type || 'info'} ${!data.image ? 'no-image' : ''}`}>
            
            {data.image ? (
                <div className="announcement-hero">
                    <img src={data.image} alt="" />
                    <div className="announcement-hero-overlay" />
                </div>
            ) : (
                <div className="announcement-spacer" />
            )}
            
            <div className="announcement-content">
                {}
                <div className="announcement-icon-ring">
                    {getHeaderIcon()}
                </div>

                <h2 className="announcement-title">{data.title}</h2>
                
                <div className="announcement-body">
                    {data.message.split('\n').map((line, i) => (
                        <p key={i}>{line || <br/>}</p>
                    ))}
                </div>

                <div className="announcement-actions">
                    {data.buttons && data.buttons.map((btn, idx) => (
                        <button 
                            key={idx}
                            className={`announcement-btn ${btn.primary ? 'primary' : 'secondary'}`}
                            onClick={() => handleAction(btn)}
                        >
                            {btn.action === 'copy' && <Copy size={16} />}
                            <span>{btn.label}</span>
                            {btn.action === 'external' && <AltArrowRight size={16} />}
                        </button>
                    ))}
                    
                    {(!data.buttons || data.buttons.length === 0) && (
                        <button className="announcement-btn primary" onClick={markAsSeen}>
                            Понятно
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemoteAnnouncementModal;