import React from 'react';

const RemoveIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const AddIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const PollCreator = ({ pollData, onChange, onRemove }) => {
    
    const handleQuestionChange = (e) => onChange({ ...pollData, question: e.target.value });
    const handleOptionChange = (idx, val) => {
        const newOpts = [...pollData.options];
        newOpts[idx] = val;
        onChange({ ...pollData, options: newOpts });
    };
    const addOption = () => {
        if (pollData.options.length < 4) onChange({ ...pollData, options: [...pollData.options, ''] });
    };
    const removeOption = (idx) => {
        if (pollData.options.length > 2) onChange({ ...pollData, options: pollData.options.filter((_, i) => i !== idx) });
    };

    return (
        <div style={{
            border: '1px solid var(--color-border)', 
            borderRadius: '16px', 
            padding: '12px',
            marginBottom: '12px',
            backgroundColor: 'transparent' 
        }}>
            {}
            <input
                type="text"
                placeholder="Задайте вопрос..."
                value={pollData.question}
                onChange={handleQuestionChange}
                maxLength={255}
                autoFocus
                style={{
                    width: '100%', padding: '8px 4px', 
                    borderRadius: '4px', border: 'none', borderBottom: '2px solid var(--color-primary)',
                    background: 'transparent', color: 'var(--color-text)', 
                    fontSize: '16px', fontWeight: 'bold', outline: 'none', marginBottom: '12px'
                }}
            />
            
            {}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pollData.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', 
                            border: '1px solid var(--color-border)', borderRadius: '8px', 
                            padding: '0 10px', backgroundColor: 'var(--color-input-bg)'
                        }}>
                            <input
                                type="text"
                                placeholder={`Вариант ${idx + 1}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                maxLength={25}
                                style={{
                                    width: '100%', padding: '10px 0', border: 'none',
                                    background: 'transparent', color: 'var(--color-text)', outline: 'none', fontSize: '14px'
                                }}
                            />
                            {opt.length > 20 && <span style={{fontSize: 10, color: 'orange'}}>{25 - opt.length}</span>}
                        </div>
                        {pollData.options.length > 2 && (
                            <button type="button" onClick={() => removeOption(idx)} style={{ color: '#f4212e', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <RemoveIcon />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                {pollData.options.length < 4 ? (
                    <button type="button" onClick={addOption} style={{ 
                        background: 'none', border: 'none', color: 'var(--color-primary)', 
                        fontWeight: '600', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 4 
                    }}>
                        <AddIcon /> Добавить вариант
                    </button>
                ) : <div />}
                
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={pollData.multiple} onChange={() => onChange({...pollData, multiple: !pollData.multiple})} />
                        <span>Несколько ответов</span>
                    </label>
                    <button type="button" onClick={onRemove} style={{ color: '#f4212e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                        Удалить опрос
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PollCreator;