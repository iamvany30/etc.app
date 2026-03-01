import React from 'react';
import { Link } from 'react-router-dom';

export const MARKDOWN_CONFIG = {
    'bold':      { start: '**', end: '**' },
    'italic':    { start: '_',  end: '_' },
    'underline': { start: '__', end: '__' },
    'strike':    { start: '~~', end: '~~' },
    'spoiler':   { start: '||', end: '||' },
    'code':      { start: '`',  end: '`' },
    'monospace': { start: '`',  end: '`' },
};



export const reconstructMarkdown = (plainText, spans = []) => {
    if (!spans || spans.length === 0) return plainText;
    
    const points = [];
    spans.forEach(s => {
        const conf = MARKDOWN_CONFIG[s.type];
        if (conf) {
            points.push({ idx: s.offset, text: conf.start, type: 'start', priority: 1 });
            points.push({ idx: s.offset + s.length, text: conf.end, type: 'end', priority: 2 });
        }
    });

    
    points.sort((a, b) => b.idx - a.idx || b.priority - a.priority);

    let result = plainText;
    for (const p of points) {
        result = result.slice(0, p.idx) + p.text + result.slice(p.idx);
    }
    return result;
};

export const renderTextWithSpans = (text, spans = [], onLinkClick) => {
    if (!text) return '';
    if (!spans || spans.length === 0) return text;

    const boundaries = new Set([0, text.length]);
    spans.forEach(s => {
        boundaries.add(s.offset);
        boundaries.add(s.offset + s.length);
    });

    const sortedBoundaries = [...boundaries].sort((a, b) => a - b);
    const segments = [];

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
        const start = sortedBoundaries[i];
        const end = sortedBoundaries[i + 1];
        if (start === end) continue;

        const content = text.substring(start, end);
        const activeStyles = new Set();
        let link, mention, hashtag;

        for (const span of spans) {
            if (span.offset <= start && (span.offset + span.length) >= end) {
                if (span.type === 'link') link = span;
                else if (span.type === 'mention') mention = span;
                else if (span.type === 'hashtag') hashtag = span;
                else activeStyles.add(span.type);
            }
        }
        segments.push({ content, styles: activeStyles, link, mention, hashtag });
    }

    return segments.map((seg, i) => {
        let element = <React.Fragment>{seg.content}</React.Fragment>;
        
        if (seg.styles.has('code') || seg.styles.has('monospace')) element = <code className="md-code">{element}</code>;
        if (seg.styles.has('bold')) element = <span className="md-bold">{element}</span>;
        if (seg.styles.has('italic')) element = <span className="md-italic">{element}</span>;
        if (seg.styles.has('underline')) element = <span className="md-underline">{element}</span>;
        if (seg.styles.has('strike')) element = <span className="md-strike">{element}</span>;
        if (seg.styles.has('spoiler')) {
            element = (
                <span className="md-spoiler" onClick={(e) => { e.stopPropagation(); e.currentTarget.classList.add('revealed'); }}>
                    {element}
                </span>
            );
        }

        if (seg.link) {
            
            let cleanUrl = seg.link.url;
            if (cleanUrl && cleanUrl.startsWith('asset://') && cleanUrl.includes('?url=')) {
                try { cleanUrl = decodeURIComponent(cleanUrl.split('?url=')[1]); } catch(e){}
            }
            return <a key={i} href={cleanUrl} onClick={(e) => onLinkClick(e, cleanUrl)} className="md-link">{element}</a>;
        }
        
        if (seg.mention) return <Link key={i} to={`/profile/${seg.mention.username}`} onClick={(e) => e.stopPropagation()} className="md-mention">{element}</Link>;
        if (seg.hashtag) return <Link key={i} to={`/explore?q=${encodeURIComponent('#' + seg.hashtag.tag)}`} onClick={(e) => e.stopPropagation()} className="md-tag">{element}</Link>;

        return <React.Fragment key={i}>{element}</React.Fragment>;
    });
};