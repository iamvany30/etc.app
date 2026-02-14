import React from 'react';

const RemoveIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const PollCreator = ({ pollData, onChange, onRemove }) => {
    
    const handleQuestionChange = (e) => {
        onChange({ ...pollData, question: e.target.value });
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...pollData.options];
        newOptions[index] = value;
        onChange({ ...pollData, options: newOptions });
    };

    const addOption = () => {
        if (pollData.options.length < 4) {
            onChange({ ...pollData, options: [...pollData.options, ''] });
        }
    };

    const removeOption = (index) => {
        if (pollData.options.length > 2) {
            const newOptions = pollData.options.filter((_, i) => i !== index);
            onChange({ ...pollData, options: newOptions });
        }
    };

    const toggleMultiple = () => {
        onChange({ ...pollData, multiple: !pollData.multiple });
    };

    return (
        <div className="poll-creator" style={{ marginTop: 12, border: '1px solid var(--color-border)', borderRadius: 12, padding: 12, background: 'var(--color-item-bg)' }}>
            <div className="poll-creator-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <span style={{color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>Опрос</span>
                <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <RemoveIcon />
                </button>
            </div>
            
            
            <input
                type="text"
                placeholder="Вопрос"
                value={pollData.question}
                onChange={handleQuestionChange}
                maxLength={255}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none', marginBottom: 12, fontSize: 16 }}
            />
            
            <div className="poll-options-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pollData.options.map((opt, idx) => (
                    <div key={idx} className="poll-option-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder={`Вариант ${idx + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            maxLength={25}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }}
                        />
                        {pollData.options.length > 2 && (
                            <button type="button" onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                                <RemoveIcon />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="poll-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                {pollData.options.length < 4 ? (
                    <button type="button" onClick={addOption} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        + Добавить вариант
                    </button>
                ) : <div></div>}
                
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={pollData.multiple} 
                        onChange={toggleMultiple} 
                    />
                    <span>Несколько ответов</span>
                </label>
            </div>
        </div>
    );
};

export default PollCreator;