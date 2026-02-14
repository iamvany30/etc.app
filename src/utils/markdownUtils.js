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

/**
 * Парсит текст, извлекает сущности и стили, возвращает чистый текст и массив спанов.
 * Обрабатывает вложенность и пересечения.
 */
export const parseAndCleanForBackend = (text) => {
    if (!text) return { cleanText: '', spans: [] };

    const tokens = [];
    
    const regex = /(https?:\/\/[^\s<>"')\]]+)|(#([a-zA-Zа-яА-ЯёЁ0-9_]+))|(@([a-zA-Z0-9_]+))|(\*\*\*|\*\*|__|_|~~|\|\||`|\*)/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
        const [full, link, _h, hashtag, _m, mention, style] = match;
        if (link) tokens.push({ type: 'link', start: match.index, end: match.index + full.length, url: link });
        else if (hashtag) tokens.push({ type: 'hashtag', start: match.index, end: match.index + full.length, tag: hashtag });
        else if (mention) tokens.push({ type: 'mention', start: match.index, end: match.index + full.length, username: mention });
        else if (style) tokens.push({ type: 'style', start: match.index, end: match.index + full.length, marker: style });
    }

    const spans = [];
    const stack = [];
    
    
    for (const token of tokens) {
        if (token.type !== 'style') {
            spans.push(token);
            continue;
        }

        const marker = token.marker;
        
        if (marker === '***') {
            const last = stack.length > 0 ? stack[stack.length - 1] : null;
            if (last && last.marker === '***') {
                const open = stack.pop();
                spans.push({ type: 'bold', start: open.start, end: token.end });
                spans.push({ type: 'italic', start: open.start, end: token.end });
            } else {
                stack.push(token);
            }
            continue;
        }

        const typeMap = { '**': 'bold', '__': 'underline', '~~': 'strike', '||': 'spoiler', '`': 'code', '*': 'italic', '_': 'italic' };
        const type = typeMap[marker];
        
        const openIdx = stack.findLastIndex(t => t.marker === marker);
        if (openIdx !== -1) {
            const open = stack.splice(openIdx, 1)[0];
            spans.push({ type: type, start: open.start, end: token.end });
        } else {
            stack.push(token);
        }
    }

    
    spans.sort((a, b) => a.start - b.start);

    
    let cleanText = '';
    let lastPos = 0;
    const finalSpans = [];

    
    const points = new Set([0, text.length]);
    spans.forEach(s => { points.add(s.start); points.add(s.end); });
    const sortedPoints = Array.from(points).sort((a, b) => a - b);

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const start = sortedPoints[i];
        const end = sortedPoints[i + 1];
        const part = text.substring(start, end);
        
        
        const isMarker = spans.some(s => s.type === 'style' && (s.start === start || s.end === end));
        const styleMatching = Object.keys(MARKDOWN_CONFIG).some(k => MARKDOWN_CONFIG[k].start === part || MARKDOWN_CONFIG[k].end === part);

        if (styleMatching) continue;

        const currentOffset = cleanText.length;
        cleanText += part;

        
        for (const span of spans) {
            if (span.start <= start && span.end >= end) {
                const existing = finalSpans.find(fs => fs._origStart === span.start && fs.type === span.type);
                if (existing) {
                    existing.length += part.length;
                } else {
                    const newSpan = { type: span.type, offset: currentOffset, length: part.length, _origStart: span.start };
                    if (span.url) newSpan.url = span.url;
                    if (span.tag) newSpan.tag = span.tag;
                    if (span.username) newSpan.username = span.username;
                    finalSpans.push(newSpan);
                }
            }
        }
    }

    return { 
        cleanText, 
        spans: finalSpans.map(({ _origStart, ...rest }) => rest) 
    };
};

/**
 * Восстанавливает Markdown-разметку для редактирования
 */
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

/**
 * Рендерит чистый текст со спанами в React-компоненты
 */
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

        if (seg.link) return <a key={i} href={seg.link.url} onClick={(e) => onLinkClick(e, seg.link.url)} className="md-link">{element}</a>;
        if (seg.mention) return <Link key={i} to={`/profile/${seg.mention.username}`} onClick={(e) => e.stopPropagation()} className="md-mention">{element}</Link>;
        if (seg.hashtag) return <Link key={i} to={`/explore?q=${encodeURIComponent('#' + seg.hashtag.tag)}`} onClick={(e) => e.stopPropagation()} className="md-tag">{element}</Link>;

        return <React.Fragment key={i}>{element}</React.Fragment>;
    });
};