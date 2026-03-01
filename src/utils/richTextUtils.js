/* @source src/utils/richTextUtils.js */

export const FORMAT_CLASSES = {
    bold: 'md-bold',
    italic: 'md-italic',
    underline: 'md-underline',
    strike: 'md-strike',
    spoiler: 'md-spoiler',
    code: 'md-code', 
    link: 'md-link'
};

export const escapeHtml = (text) => {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export const extractTextAndSpansFromDOM = (rootNode) => {
    const spans = [];
    let plainText = "";

    const isBlock = (node) => ['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName);

    const traverse = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            plainText += node.textContent || "";
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (isBlock(node) && plainText.length > 0 && !plainText.endsWith('\n')) {
                plainText += '\n';
            }
            if (node.tagName === 'BR') {
                plainText += '\n';
            }

            let formatType = null;
            let url = null;
            
            for (const [type, className] of Object.entries(FORMAT_CLASSES)) {
                if (node.classList.contains(className)) {
                    formatType = type;
                    if (type === 'link') {
                        url = node.dataset.url || node.getAttribute('href') || "";
                    }
                    break;
                }
            }

            const startOffset = plainText.length;

            for (const child of Array.from(node.childNodes)) {
                traverse(child);
            }

            
            const spanText = plainText.substring(startOffset);
            if (formatType && spanText.trim().length > 0) {
                const spanData = { type: formatType, offset: startOffset, length: plainText.length - startOffset };
                if (url) spanData.url = url;
                spans.push(spanData);
            }
        }
    };

    traverse(rootNode);

    const entityRegex = /(https?:\/\/[^\s<>"')\]]+)|(#([a-zA-Zа-яА-ЯёЁ0-9_]+))|(@([a-zA-Z0-9_]+))/g;
    let match;
    while ((match = entityRegex.exec(plainText)) !== null) {
        const isOverlapping = spans.some(s => 
            (s.type === 'link' || s.type === 'hashtag' || s.type === 'mention') &&
            s.offset <= match.index && 
            (s.offset + s.length) >= (match.index + match[0].length)
        );

        if (!isOverlapping) {
            if (match[1]) spans.push({ type: 'link', offset: match.index, length: match[1].length, url: match[1] });
            if (match[2]) spans.push({ type: 'hashtag', offset: match.index, length: match[2].length, tag: match[2] });
            if (match[4]) spans.push({ type: 'mention', offset: match.index, length: match[4].length, username: match[4] });
        }
    }

    return { text: plainText, spans };
};

export const textAndSpansToHtml = (text, spans) => {
    if (!text) return "";
    if (!spans || spans.length === 0) return escapeHtml(text).replace(/\n/g, '<br>');

    const boundaries = new Set([0, text.length]);
    spans.forEach(s => {
        boundaries.add(s.offset);
        boundaries.add(s.offset + s.length);
    });

    const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
    let html = "";

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
        const start = sortedBoundaries[i];
        const end = sortedBoundaries[i + 1];
        if (start === end) continue;

        let segment = escapeHtml(text.substring(start, end));
        const activeSpans = spans.filter(s => s.offset <= start && (s.offset + s.length) >= end);

        activeSpans.forEach(span => {
            const className = FORMAT_CLASSES[span.type];
            if (className) {
                if (span.type === 'link' && span.url) {
                    segment = `<span class="${className}" data-url="${escapeHtml(span.url)}">${segment}</span>`;
                } else {
                    segment = `<span class="${className}">${segment}</span>`;
                }
            }
        });

        html += segment;
    }

    return html.replace(/\n/g, '<br>');
};