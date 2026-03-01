/* @source src/components/modals/PostHistoryModal.jsx */
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useModalStore } from '../../store/modalStore';
import { RichText } from '../RichText';

const PostHistoryModal = ({ postId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.getPostHistory(postId).then(res => {
            setHistory(res?.data?.history || res?.history || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [postId]);

    return (
        <div style={{ padding: '24px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '800' }}>История изменений</h2>
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {loading ? (
                    <div style={{ color: 'var(--color-text-secondary)' }}>Загрузка истории...</div>
                ) : history.length === 0 ? (
                    <div style={{ color: 'var(--color-text-secondary)' }}>История пуста</div>
                ) : (
                    history.map((item, idx) => (
                        <div key={idx} style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                {new Date(item.editedAt).toLocaleString('ru-RU')}
                            </div>
                            <div style={{ fontSize: '15px', color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                <RichText
                                    text={item.content}
                                    spans={item.spans}
                                    onLinkClick={() => { }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PostHistoryModal;