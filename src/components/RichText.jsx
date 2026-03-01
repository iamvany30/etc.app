/* @source src/components/RichText.jsx */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

export const RichText = ({ text, spans = [], onLinkClick, className = "" }) => {
    const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

    const segments = useMemo(() => {
        if (!text) return [];
        if (!spans || spans.length === 0) return [{ text, styles: new Set() }];

        const boundaries = new Set([0, text.length]);
        spans.forEach(s => {
            boundaries.add(s.offset);
            boundaries.add(s.offset + s.length);
        });

        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
        const result = [];

        for (let i = 0; i < sortedBoundaries.length - 1; i++) {
            const start = sortedBoundaries[i];
            const end = sortedBoundaries[i + 1];
            if (start === end) continue;

            const content = text.substring(start, end);
            const activeStyles = new Set();
            let linkUrl = null, mentionId = null, hashtag = null;

            spans.forEach(span => {
                if (span.offset <= start && (span.offset + span.length) >= end) {
                    activeStyles.add(span.type);
                    if (span.type === 'link') linkUrl = span.url;
                    if (span.type === 'mention') mentionId = span.username;
                    if (span.type === 'hashtag') hashtag = span.tag;
                }
            });

            result.push({ text: content, styles: activeStyles, linkUrl, mentionId, hashtag, index: i });
        }
        return result;
    }, [text, spans]);

    const toggleSpoiler = (e, index) => {
        e.stopPropagation();
        setRevealedSpoilers(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    };

    return (
        <span className={className}>
            {segments.map((seg) => {
                let element = <React.Fragment>{seg.text}</React.Fragment>;

                
                if (seg.styles.has('bold')) element = <b>{element}</b>;
                if (seg.styles.has('italic')) element = <i>{element}</i>;
                if (seg.styles.has('underline')) element = <u>{element}</u>;
                if (seg.styles.has('strike')) element = <s>{element}</s>;
                if (seg.styles.has('code')) element = <code className="md-code">{element}</code>;

                if (seg.styles.has('spoiler')) {
                    const isRevealed = revealedSpoilers.has(seg.index);
                    element = (
                        <span 
                            className={`md-spoiler ${isRevealed ? 'revealed' : ''}`} 
                            onClick={(e) => toggleSpoiler(e, seg.index)}
                        >
                            {element}
                        </span>
                    );
                }

                if (seg.styles.has('link') && seg.linkUrl) {
                    let cleanUrl = seg.linkUrl;
                    if (cleanUrl.startsWith('asset://') && cleanUrl.includes('?url=')) {
                        try { cleanUrl = decodeURIComponent(cleanUrl.split('?url=')[1]); } catch(e){}
                    }
                    element = <a href={cleanUrl} onClick={(e) => onLinkClick && onLinkClick(e, cleanUrl)} className="md-link">{element}</a>;
                } else if (seg.styles.has('mention') && seg.mentionId) {
                    element = <Link to={`/profile/${seg.mentionId}`} onClick={(e) => e.stopPropagation()} className="md-mention">{element}</Link>;
                } else if (seg.styles.has('hashtag') && seg.hashtag) {
                    element = <Link to={`/explore?q=${encodeURIComponent(seg.hashtag)}`} onClick={(e) => e.stopPropagation()} className="md-tag">{element}</Link>;
                }

                return <React.Fragment key={seg.index}>{element}</React.Fragment>;
            })}
        </span>
    );
};