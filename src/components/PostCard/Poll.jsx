import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import '../../styles/Poll.css';

/**
 * Вспомогательная функция для склонения слова "голос"
 */
function declension(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

const Poll = ({ poll, postId }) => {
    
    const [localPoll, setLocalPoll] = useState(poll);
    const [isVoting, setIsVoting] = useState(false);

    
    useEffect(() => {
        setLocalPoll(poll);
    }, [poll]);

    if (!localPoll) return null;

    
    const options = localPoll.options || [];
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votesCount || 0), 0);
    const hasVoted = options.some(opt => opt.isVoted);
    const isExpired = localPoll.expiresAt && new Date(localPoll.expiresAt) < new Date();

    const handleVote = async (optionId) => {
        
        if (hasVoted || isExpired || isVoting) return;

        setIsVoting(true);
        try {
            const res = await apiClient.votePoll(postId, [optionId]);
            if (res && !res.error) {
                
                const updatedPoll = res.data?.poll || res.poll || res.data || res;
                setLocalPoll(updatedPoll);
            } else {
                console.error("Poll vote error:", res?.error);
            }
        } catch (e) {
            console.error("Voting failed", e);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="poll-container" onClick={e => e.stopPropagation()}>
            {}
            <div className="poll-question">
                {localPoll.question || localPoll.text || "Опрос"}
            </div>

            <div className="poll-options">
                {options.map(option => {
                    const percent = totalVotes > 0 
                        ? Math.round((option.votesCount / totalVotes) * 100) 
                        : 0;

                    return (
                        <div 
                            key={option.id}
                            className={`poll-option ${hasVoted ? 'voted' : ''} ${option.isVoted ? 'my-vote' : ''} ${isVoting ? 'loading' : ''}`}
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
                <span>
                    {totalVotes} {declension(totalVotes, ['голос', 'голоса', 'голосов'])}
                </span>
                {isExpired && <span> • Опрос завершен</span>}
                {localPoll.multipleChoice && <span> • Можно выбрать несколько</span>}
            </div>
        </div>
    );
};

export default Poll;