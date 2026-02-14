import { ComponentRegistry } from './ComponentRegistry';
import { setupExposedContext } from './ExposedContext';
import * as Babel from '@babel/standalone';

export const ThemeLoader = {
    async init() {
        setupExposedContext();

        const oldStyle = document.getElementById('theme-dynamic-style');
        if (oldStyle) oldStyle.remove();
        
        ComponentRegistry.clear();
        
        if (window.ItdApp && window.ItdApp.restoreAllStyles) {
            window.ItdApp.restoreAllStyles();
        }

        const themeFolder = localStorage.getItem('itd_current_theme_folder');
        if (!themeFolder || themeFolder === 'default') return;

        try {
            if (!window.api) return;

            const data = await window.api.invoke('themes:read-content', themeFolder);
            if (!data || data.error) return;

            const manifest = data.manifest || {};

            
            if (manifest.colors) {
                if (manifest.colors.accent) {
                    const color = manifest.colors.accent;
                    document.documentElement.style.setProperty('--color-primary', color);
                    localStorage.setItem('nowkie_accent', color);
                }
                if (manifest.colors.background) {
                    const bg = manifest.colors.background;
                    if (['light', 'dim', 'black'].includes(bg)) {
                        document.documentElement.setAttribute('data-bg', bg);
                        localStorage.setItem('nowkie_bg', bg);
                    }
                }
            }

            if (manifest.unload && Array.isArray(manifest.unload)) {
                window.ItdApp.unload(manifest.unload);
            }

            if (data.cssFiles && data.cssFiles.length > 0) {
                let combinedCss = data.cssFiles.map(f => `/* Theme: ${f.name} */\n${f.content}`).join('\n');
                let s = document.createElement('style');
                s.id = 'theme-dynamic-style';
                s.textContent = combinedCss;
                document.head.appendChild(s);
            }

            
            if (data.jsFiles && data.jsFiles.length > 0) {
                
                const cacheKeyBase = `theme_cache_${themeFolder}_${manifest.version || '0.0.0'}_`;

                for (const file of data.jsFiles) {
                    try {
                        let compiled;
                        const fileCacheKey = cacheKeyBase + file.name;
                        const cached = localStorage.getItem(fileCacheKey);

                        
                        
                        if (cached) {
                            const [len, code] = cached.split('|||SPLIT|||');
                            if (parseInt(len) === file.content.length) {
                                compiled = code;
                                
                            }
                        }

                        if (!compiled) {
                            
                            compiled = Babel.transform(file.content, {
                                presets: ['react', 'env'],
                                filename: file.name
                            }).code;
                            
                            
                            localStorage.setItem(fileCacheKey, `${file.content.length}|||SPLIT|||${compiled}`);
                        }

                        const runScript = new Function(compiled);
                        runScript();
                    } catch (e) {
                        console.error(`[ThemeLoader] Error in ${file.name}:`, e);
                    }
                }
            }

        } catch (e) {
            console.error("ThemeLoader: Critical Failure", e);
        }
    }
};