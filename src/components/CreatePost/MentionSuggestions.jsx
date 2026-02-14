import React from 'react';

const MentionSuggestions = ({ users, onSelect, isLoading }) => {
    if (isLoading) {
        return <div className="mention-suggestions-box loading">Поиск...</div>;
    }

    if (!users || users.length === 0) {
        return null;
    }

    return (
        <div className="mention-suggestions-box">
            {users.map(user => (
                <div 
                    key={user.id} 
                    className="mention-item"
                    
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(user.username);
                    }}
                >
                    <div className="avatar" style={{width: 32, height: 32, fontSize: 16}}>{user.avatar}</div>
                    <div className="mention-user-info">
                        <span className="display-name">{user.displayName}</span>
                        <span className="username">@{user.username}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MentionSuggestions;