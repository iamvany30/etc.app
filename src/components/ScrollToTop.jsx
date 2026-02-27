/* @source src/components/ScrollToTop.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { AltArrowUp } from "@solar-icons/react";
import '../styles/ScrollToTop.css';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    
    
    const scrollerRef = useRef(null);
    const ticking = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    
                    if (!scrollerRef.current) {
                        scrollerRef.current = document.querySelector('.content [data-virtuoso-scroller="true"]');
                    }
                    
                    const scrolled = scrollerRef.current 
                        ? scrollerRef.current.scrollTop 
                        : window.scrollY; 

                    setIsVisible(scrolled > 500);
                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, []);

    const scrollToTop = () => {
        
        if (!scrollerRef.current) {
            scrollerRef.current = document.querySelector('.content [data-virtuoso-scroller="true"]');
        }
        
        if (scrollerRef.current) {
            scrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
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