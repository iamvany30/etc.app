/* @source src/components/ScrollArea.jsx */
import React, { forwardRef } from 'react';
import '../styles/ScrollArea.css';

const ScrollArea = forwardRef(({ children, className = '', style, ...props }, ref) => {
    return (
        <div 
            ref={ref}
            className={`custom-scroll-area ${className}`} 
            style={style}
            {...props}
        >
            {children}
        </div>
    );
});

export default ScrollArea;