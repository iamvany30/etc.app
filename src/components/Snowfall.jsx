import React, { useEffect, useRef } from 'react';

const Snowfall = () => {
    const canvasRef = useRef(null);
    const mouse = useRef({ x: -1000, y: -1000 });
    const isVisible = useRef(true); 

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d', { alpha: true }); 
        let animationFrameId;

        let snowflakes = [];
        const snowflakeCount = 80; 

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initSnow();
        };

        const initSnow = () => {
            snowflakes = [];
            for (let i = 0; i < snowflakeCount; i++) {
                const z = Math.random() * 3; 
                snowflakes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: z + 0.3,
                    speed: (z + 0.5) * 0.25, 
                    opacity: (z / 3) * 0.4 + 0.15,
                    wind: Math.random() * 0.4 - 0.2, 
                    swing: Math.random() * 2, 
                    swingSpeed: Math.random() * 0.02, 
                    offset: Math.random() * 1000,
                    vx: 0,
                    vy: 0
                });
            }
        };

        const handleMouseMove = (e) => {
            mouse.current = { x: e.clientX, y: e.clientY };
        };
        
        
        const handleVisibilityChange = () => {
            isVisible.current = document.visibilityState === 'visible';
        };

        const draw = () => {
            
            if (!isVisible.current) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            snowflakes.forEach(p => {
                p.offset += p.swingSpeed;
                const currentSwing = Math.sin(p.offset) * p.swing;

                
                const dx = p.x - mouse.current.x;
                const dy = p.y - mouse.current.y;
                
                
                const distSq = dx*dx + dy*dy;
                const maxDistSq = 250 * 250;

                if (distSq < maxDistSq) {
                    const dist = Math.sqrt(distSq);
                    const force = (250 - dist) / 250;
                    const strength = 2; 
                    
                    p.vx += (dx / dist) * force * strength;
                    p.vy += (dy / dist) * force * strength;
                }

                p.vx *= 0.92; 
                p.vy *= 0.92;

                p.x += p.wind + currentSwing + p.vx;
                p.y += p.speed + p.vy;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();

                if (p.y > canvas.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                    p.vx = 0; p.vy = 0;
                }
                if (p.x > canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = canvas.width + 20;
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 5, 
                width: '100%',
                height: '100%',
                opacity: 0.7
            }}
        />
    );
};

export default Snowfall;