export const FontLoader = {
    async init() {
        const activeFontId = localStorage.getItem('itd_font_family') || 'system';
        const activeEmojiId = localStorage.getItem('itd_emoji_family') || 'system';

        const styleId = 'dynamic-fonts-style';
        let styleTag = document.getElementById(styleId);
        
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        try {
            let css = '';
            
            let textFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
            let emojiFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';

            let localFiles = [];
            if (window.api) {
                localFiles = await window.api.invoke('fonts:get-local');
            }

            
            if (activeFontId && activeFontId !== 'system') {
                const textFile = localFiles.find(f => f.startsWith(activeFontId + '.'));
                if (textFile) {
                    const ext = textFile.split('.').pop();
                    const format = ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : ext === 'woff2' ? 'woff2' : 'woff';
                    
                    css += `
                        @font-face {
                            font-family: 'DynamicTextFont';
                            src: url('font://${textFile}') format('${format}');
                            font-weight: 100 900;
                            font-display: swap;
                        }
                    `;
                    textFamily = `'DynamicTextFont', ${textFamily}`;
                }
            }

            
            if (activeEmojiId && activeEmojiId !== 'system') {
                const emojiFile = localFiles.find(f => f.startsWith(activeEmojiId + '.'));
                if (emojiFile) {
                    const ext = emojiFile.split('.').pop();
                    const format = ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : ext === 'woff2' ? 'woff2' : 'woff';
                    
                    
                    const emojiRange = 'U+00A9-00AE, U+200D, U+20E3, U+203C-3299, U+FE0F, U+1F000-1FBFF';
                    
                    css += `
                        @font-face {
                            font-family: 'DynamicEmojiFont';
                            src: url('font://${emojiFile}') format('${format}');
                            unicode-range: ${emojiRange};
                            font-display: swap;
                        }
                    `;
                    emojiFamily = `'DynamicEmojiFont', ${emojiFamily}`;
                }
            }

            styleTag.textContent = css;

            
            document.documentElement.style.setProperty('--font-emoji', emojiFamily);
            
            document.documentElement.style.setProperty('--font-main', `${textFamily}, ${emojiFamily}`);

        } catch (e) {
            console.error("FontLoader failed:", e);
        }
    }
};