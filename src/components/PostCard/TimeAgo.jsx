import React, { useState, useEffect } from 'react';

const TimeAgo = ({ dateStr }) => {
    const [time, setTime] = useState('');
    
    useEffect(() => {
        if (!dateStr) return;
        const calcTime = () => {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = Math.round((now - date) / 1000);
            if (diff < 60) setTime(`${diff}с`);
            else if (diff < 3600) setTime(`${Math.floor(diff / 60)}м`);
            else if (diff < 86400) setTime(`${Math.floor(diff / 3600)}ч`);
            else setTime(date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
        };
        calcTime();
        const timer = setInterval(calcTime, 60000);
        return () => clearInterval(timer);
    }, [dateStr]);

    return <span className="post-time">{time}</span>;
};

export default TimeAgo;