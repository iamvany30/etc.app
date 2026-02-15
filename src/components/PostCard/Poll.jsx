import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import '../../styles/Poll.css';

const Poll = ({ poll, postId }) => {
    const [localPoll, setLocalPoll] = useState(poll);
    const [isVoting, setIsVoting] = useState(false);

    const totalVotes = localPoll.options.reduce((sum, opt) => sum + (opt.votesCount || 0), 0);
    const hasVoted = localPoll.options.some(opt => opt.isVoted);
    const isExpired = localPoll.expiresAt && new Date(localPoll.expiresAt) < new Date();

    const handleVote = async (optionId) => {
        if (hasVoted || isExpired || isVoting) return;

        setIsVoting(true);
        try {
            const res = await apiClient.votePoll(postId, [optionId]);
            if (res && !res.error) {
                
                
                const updatedPoll = res.data?.poll || res.poll || res.data || res;
                setLocalPoll(updatedPoll);
            }
        } catch (e) {
            console.error("Voting failed", e);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="poll-container" onClick={e => e.stopPropagation()}>
            <div className="poll-question">{localPoll.question}</div>
            <div className="poll-options">
                {localPoll.options.map(option => {
                    const percent = totalVotes > 0 
                        ? Math.round((option.votesCount / totalVotes) * 100) 
                        : 0;

                    return (
                        <div 
                            key={option.id}
                            className={`poll-option ${hasVoted ? 'voted' : ''} ${option.isVoted ? 'my-vote' : ''}`}
                            onClick={() => handleVote(option.id)}
                        >
                            {hasVoted && (
                                <div 
                                    className="poll-bar-fill" 
                                    style={{ width: `${percent}%` }} 
                                />
                            )}
                            <div className="poll-option-content">
                                <span className="option-text">{option.text}</span>
                                {hasVoted && <span className="option-percent">{percent}%</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="poll-footer">
                <span>{totalVotes} голосов</span>
                {isExpired && <span> • Опрос завершен</span>}
            </div>
        </div>
    );
};

export default Poll;