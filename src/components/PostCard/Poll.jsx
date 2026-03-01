/* @source src/components/PostCard/Poll.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useUserStore } from '../../store/userStore';
import { apiClient } from '../../api/client';
import { CheckCircle } from "@solar-icons/react";
import '../../styles/Poll.css';


function declension(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}


const getVotesCount = (option) => {
    return option.votes ?? option.votesCount ?? option.voteCount ?? 0;
};

const Poll = ({ poll, postId }) => {
    const updatePollData = useUserStore(state => state.updatePollData);


    const [localPoll, setLocalPoll] = useState(poll);


    const [pendingVotes, setPendingVotes] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);


    useEffect(() => {
        setLocalPoll(poll);
    }, [poll]);


    const pollState = useMemo(() => {
        if (!localPoll) return null;

        const {
            question,
            options = [],
            multipleChoice,
            myVotes,
            myVote,
            votedOptionIds,
            totalVotes: serverTotal
        } = localPoll;


        const userVotesSet = new Set();


        if (Array.isArray(myVotes)) myVotes.forEach(id => userVotesSet.add(id));
        if (Array.isArray(votedOptionIds)) votedOptionIds.forEach(id => userVotesSet.add(id));


        if (myVote) userVotesSet.add(myVote);


        options.forEach(opt => {
            if (opt.isVoted === true || opt.voted === true) {
                userVotesSet.add(opt.id);
            }
        });

        const hasVoted = userVotesSet.size > 0;


        const calculatedTotal = options.reduce((acc, opt) => acc + getVotesCount(opt), 0);
        const totalVotes = Math.max(serverTotal || 0, calculatedTotal);

        return {
            question,
            options,
            multipleChoice,
            userVotesSet,
            hasVoted,
            totalVotes
        };
    }, [localPoll]);

    if (!pollState) return null;
    const { question, options, multipleChoice, userVotesSet, hasVoted, totalVotes } = pollState;

    const handleOptionClick = (optionId) => {
        if (isSubmitting) return;
        if (hasVoted) return;

        if (multipleChoice) {
            setPendingVotes(prev => {
                const next = new Set(prev);
                if (next.has(optionId)) next.delete(optionId);
                else next.add(optionId);
                return next;
            });
        } else {

            submitVotes([optionId]);
        }
    };

    const submitVotes = async (votesArray) => {
        if (votesArray.length === 0 || isSubmitting) return;

        setIsSubmitting(true);


        const newOptions = options.map(opt => {
            const currentVotes = getVotesCount(opt);
            const wasVoted = userVotesSet.has(opt.id);
            const willVote = votesArray.includes(opt.id);

            let newCount = currentVotes;

            if (wasVoted && !willVote) newCount = Math.max(0, newCount - 1);

            if (!wasVoted && willVote) newCount = newCount + 1;

            return {
                ...opt,
                votes: newCount,
                votesCount: newCount,
                isVoted: willVote
            };
        });

        const optimisticState = {
            ...localPoll,
            options: newOptions,
            myVotes: votesArray,
            votedOptionIds: votesArray,
            myVote: votesArray[0] || null,
            totalVotes: newOptions.reduce((acc, o) => acc + o.votes, 0)
        };

        setLocalPoll(optimisticState);
        updatePollData(postId, optimisticState);


        try {
            const res = await apiClient.votePoll(postId, votesArray);

            if (res && !res.error) {
                const serverData = res.data?.poll || res.poll || res.data || res;

                const finalState = {
                    ...localPoll,
                    ...serverData,

                    myVotes: serverData.votedOptionIds || serverData.myVotes || votesArray,
                    options: serverData.options || newOptions
                };

                setLocalPoll(finalState);
                updatePollData(postId, finalState);
            }
        } catch (e) {
            console.error("Poll vote failed", e);


        } finally {
            setIsSubmitting(false);
            setPendingVotes(new Set());
        }
    };

    const handleRevote = (e) => {
        e.stopPropagation();
        if (isSubmitting) return;


        setPendingVotes(userVotesSet);



        setLocalPoll(prev => ({
            ...prev,
            myVotes: [],
            votedOptionIds: [],
            myVote: null,
            options: prev.options.map(o => ({ ...o, isVoted: false }))
        }));
    };

    return (
        <div
            className="poll-container"
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="poll-question">
                {question || "Опрос"}
            </div>

            <div className="poll-options">
                {options.map(option => {
                    const votesCount = getVotesCount(option);

                    const percent = totalVotes > 0
                        ? Math.round((votesCount / totalVotes) * 100)
                        : 0;


                    const isMyVote = userVotesSet.has(option.id);


                    const isPending = pendingVotes.has(option.id);


                    const showResult = hasVoted;

                    return (
                        <div
                            key={option.id}
                            className={`poll-option 
                                ${showResult ? 'result-view' : 'interactive'} 
                                ${isMyVote ? 'my-vote' : ''}
                                ${!showResult && isPending ? 'selected-pending' : ''}
                            `}
                            onClick={() => handleOptionClick(option.id)}
                        >
                            { }
                            {showResult && (
                                <div
                                    className="poll-bar-fill"
                                    style={{ width: `${percent}%` }}
                                />
                            )}

                            <div className="poll-option-content">
                                <div className="option-left">
                                    { }
                                    {!showResult && (
                                        <div className="poll-check-circle" />
                                    )}

                                    <span className="option-text">{option.text}</span>

                                    { }
                                    {showResult && isMyVote && (
                                        <div className="voted-checkmark">
                                            <CheckCircle size={18} variant="Bold" />
                                        </div>
                                    )}
                                </div>

                                { }
                                {showResult && (
                                    <span className="option-percent">{percent}%</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="poll-footer">
                <div className="poll-meta">
                    <span>
                        {totalVotes} {declension(totalVotes, ['голос', 'голоса', 'голосов'])}
                    </span>
                    {multipleChoice && <span> • Можно несколько</span>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    { }
                    {!hasVoted && multipleChoice && pendingVotes.size > 0 && (
                        <button
                            className="poll-submit-btn"
                            onClick={() => submitVotes(Array.from(pendingVotes))}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '...' : 'Голосовать'}
                        </button>
                    )}

                    { }
                    {hasVoted && (isHovered || window.innerWidth < 768) && (
                        <button
                            className="poll-revote-btn"
                            onClick={handleRevote}
                            disabled={isSubmitting}
                        >
                            Переголосовать
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Poll;