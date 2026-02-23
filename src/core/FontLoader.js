/* @source src/core/FontLoader.js */
export const FontLoader = {
    async init() {
        const activeFontId = localStorage.getItem('itd_font_family') || 'inter';
        const activeEmojiId = localStorage.getItem('itd_emoji_family') || 'system';

        
        document.documentElement.setAttribute('data-font', activeFontId);
        document.documentElement.setAttribute('data-emoji', activeEmojiId);

        const styleId = 'dynamic-fonts-style';
        let styleTag = document.getElementById(styleId);
        
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        try {
            let css = '';
            let localFiles = [];
            if (window.api && window.api.invoke) {
                try {
                    localFiles = await window.api.invoke('fonts:get-local');
                } catch (e) {
                    console.warn("[FontLoader] Failed to get local fonts", e);
                }
            }

            
            let customEmojiFontString = '';
            if (activeEmojiId !== 'system') {
                const emojiFile = localFiles.find(f => f.startsWith(activeEmojiId + '.'));
                if (emojiFile) {
                    const ext = emojiFile.split('.').pop();
                    const format = ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : ext === 'woff2' ? 'woff2' : 'woff';
                    
                    
                    const emojiRange = 'U+00A9-00AE, U+200D, U+20E3, U+203C-3299, U+FE0F, U+1F000-1FAFF';
                    
                    css += `
                        @font-face {
                            font-family: 'DynamicEmojiFont';
                            src: url('font://${emojiFile}') format('${format}');
                            unicode-range: ${emojiRange};
                            font-display: swap;
                        }
                    `;
                    
                    customEmojiFontString = `'DynamicEmojiFont', `;
                }
            }

            
            const standardFonts = {
                'inter': `'LocalInter'`,
                'manrope': `'LocalManrope'`,
                'system': `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial`,
                'jetbrains': `'LocalJetBrains', monospace`
            };

            let textFontString = standardFonts['inter']; 

            if (standardFonts[activeFontId]) {
                textFontString = standardFonts[activeFontId];
            } else {
                const textFile = localFiles.find(f => f.startsWith(activeFontId + '.'));
                if (textFile) {
                    const ext = textFile.split('.').pop();
                    const format = ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : ext === 'woff2' ? 'woff2' : 'woff';
                    css += `
                        @font-face {
                            font-family: 'DynamicTextFont';
                            src: url('font://${textFile}') format('${format}');
                            font-weight: 100 900;
                            font-display: block;
                        }
                    `;
                    textFontString = `'DynamicTextFont'`;
                } else {
                    
                    document.documentElement.setAttribute('data-font', 'inter');
                }
            }

            
            
            const systemEmojiFallback = `"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
            
            
            
            const finalFontMain = `${customEmojiFontString}${textFontString}, ${systemEmojiFallback}`;
            const finalFontEmoji = `${customEmojiFontString}${systemEmojiFallback}`;

            
            document.documentElement.style.setProperty('--font-main', finalFontMain);
            document.documentElement.style.setProperty('--font-emoji', finalFontEmoji);

            styleTag.textContent = css;

        } catch (e) {
            console.error("FontLoader failed:", e);
        }
    }
};