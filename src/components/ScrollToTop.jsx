/* @source ScrollToTop.jsx */
import React, { useState, useEffect } from 'react';
import { AltArrowUp } from "@solar-icons/react";
import '../styles/ScrollToTop.css';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        
        const virtuosoScroller = document.querySelector('.content [data-virtuoso-scroller="true"]');
        const scrolled = virtuosoScroller ? virtuosoScroller.scrollTop : window.pageYOffset;

        if (scrolled > 500) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        const virtuosoScroller = document.querySelector('[data-virtuoso-scroller="true"]');
        if (virtuosoScroller) {
            virtuosoScroller.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility, true);
        return () => window.removeEventListener('scroll', toggleVisibility, true);
    }, []);

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