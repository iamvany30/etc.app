import React, { useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useIslandStore } from '../../store/islandStore';
import { apiClient } from '../../api/client';
import '../../styles/ReportModal.css';

const REASONS = [
    { id: 'spam', label: 'Спам' },
    { id: 'violence', label: 'Насилие или вражда' },
    { id: 'adult', label: 'Контент 18+' },
    { id: 'fraud', label: 'Мошенничество' },
    { id: 'other', label: 'Другое' }
];

const ReportModal = ({ targetId, targetType = 'post' }) => {
    const closeModal = useModalStore(state => state.closeModal);
    const showIslandAlert = useIslandStore(state => state.showIslandAlert);
    
    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await apiClient.createReport({
                targetId,
                targetType,
                reason,
                description: description.trim() || undefined
            });

            if (res && !res.error) {
                showIslandAlert('success', 'Жалоба отправлена', '🛡️');
                closeModal();
            } else {
                showIslandAlert('error', res?.error?.message || 'Ошибка отправки', '❌');
            }
        } catch (e) {
            showIslandAlert('error', 'Ошибка сети', '📡');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-modal">
            <h2 className="report-title">Пожаловаться</h2>
            <p className="report-subtitle">Укажите причину, по которой вы хотите пожаловаться на этот контент.</p>

            <div className="report-reasons">
                {REASONS.map(r => (
                    <label key={r.id} className={`reason-item ${reason === r.id ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="report-reason" 
                            value={r.id} 
                            checked={reason === r.id}
                            onChange={() => setReason(r.id)}
                        />
                        <span className="reason-label">{r.label}</span>
                    </label>
                ))}
            </div>

            <textarea
                className="report-desc"
                placeholder="Дополнительные детали (необязательно)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
            />

            <div className="report-actions">
                <button className="cancel-btn" onClick={closeModal} disabled={loading}>
                    Отмена
                </button>
                <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Отправка...' : 'Отправить жалобу'}
                </button>
            </div>
        </div>
    );
};

export default ReportModal;