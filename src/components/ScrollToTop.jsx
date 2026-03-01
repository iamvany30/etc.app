import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AltArrowUp } from "@solar-icons/react";
import '../styles/ScrollToTop.css';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const activeScrollerRef = useRef(null);
    const ticking = useRef(false);

    
    useEffect(() => {
        setIsVisible(false);
        activeScrollerRef.current = null;
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = (e) => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const target = e.target;
                    let currentScrollY = 0;

                    
                    if (target === document || target === window) {
                        currentScrollY = window.scrollY;
                        activeScrollerRef.current = window;
                    } else if (target.scrollTop !== undefined) {
                        currentScrollY = target.scrollTop;
                        
                        
                        
                        if (
                            target.getAttribute('data-virtuoso-scroller') === 'true' ||
                            target.classList.contains('custom-scroll-area') ||
                            target.classList.contains('downloads-content') ||
                            target.classList.contains('explore-scroll-area') ||
                            target.classList.contains('music-content-scroll') ||
                            target.classList.contains('post-details-page')
                        ) {
                            activeScrollerRef.current = target;
                        }
                    }

                    
                    if (activeScrollerRef.current === target || activeScrollerRef.current === window) {
                        setIsVisible(currentScrollY > 500);
                    }
                    
                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true });
    }, []);

    const scrollToTop = () => {
        if (activeScrollerRef.current && typeof activeScrollerRef.current.scrollTo === 'function') {
            activeScrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className={`scroll-to-top-wrapper ${isVisible ? 'show' : ''}`} onClick={scrollToTop}>
            <button className="scroll-to-top-btn">
                <AltArrowUp size={20} />
                <span className="scroll-text">Наверх</span>
            </button>
        </div>
    );
};

export default ScrollToTop;