/* @source DrawingBoard.jsx */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
    PenIcon, TrashIcon, CloseIcon, EditIcon, 
    NavBackIcon, NavForwardIcon 
} from './icons/CommonIcons'; 
import '../styles/DrawingBoard.css';

const COLORS = [
    '#ffffff', '#1d9bf0', '#00ba7c', '#f91880', '#ffad1f', 
    '#794bc4', '#f4212e', '#ff7a00', '#000000'
];

const TOOLS = {
    PEN: 'pen',
    ERASER: 'eraser',
    LINE: 'line',
    RECT: 'rect',
    CIRCLE: 'circle',
    PICKER: 'picker'
};

const DrawingBoard = ({ onSave, aspectRatio = 3.24 }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    
    const [tool, setTool] = useState(TOOLS.PEN);
    const [color, setColor] = useState('#ffffff');
    const [size, setSize] = useState(5);
    const [opacity, setOpacity] = useState(1);

    
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [snapshot, setSnapshot] = useState(null);

    
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 1600; 
        canvas.height = 1600 / aspectRatio;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        contextRef.current = ctx;
        saveState();
    }, [aspectRatio]);

    const saveState = () => {
        const data = canvasRef.current.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(data);
        if (newHistory.length > 30) newHistory.shift(); 
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const loadState = (index) => {
        if (index < 0 || index >= history.length) return;
        const img = new Image();
        img.src = history[index];
        img.onload = () => {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            contextRef.current.drawImage(img, 0, 0);
            setHistoryIndex(index);
        };
    };

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        const pos = getPos(e);
        setStartPos(pos);
        setIsDrawing(true);
        
        
        setSnapshot(contextRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));

        if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
            contextRef.current.beginPath();
            contextRef.current.moveTo(pos.x, pos.y);
            contextRef.current.strokeStyle = tool === TOOLS.ERASER ? '#000000' : color;
            contextRef.current.lineWidth = size;
            contextRef.current.globalAlpha = opacity;
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        const ctx = contextRef.current;

        if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else {
            
            ctx.putImageData(snapshot, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.globalAlpha = opacity;

            if (tool === TOOLS.LINE) {
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(pos.x, pos.y);
            } else if (tool === TOOLS.RECT) {
                ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
            } else if (tool === TOOLS.CIRCLE) {
                const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
                ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            }
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveState();
        }
    };

    const clearCanvas = () => {
        if (window.confirm("Очистить холст?")) {
            contextRef.current.fillStyle = '#000000';
            contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            saveState();
        }
    };

    return (
        <div className="drawing-studio">
            {}
            <div className="studio-sidebar">
                <button className={`tool-btn ${tool === TOOLS.PEN ? 'active' : ''}`} onClick={() => setTool(TOOLS.PEN)} title="Кисть">
                </button>
                <button className={`tool-btn ${tool === TOOLS.ERASER ? 'active' : ''}`} onClick={() => setTool(TOOLS.ERASER)} title="Ластик">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.24 3.56l4.95 4.95c.78.78.78 2.05 0 2.83L11.75 20.8c-.78.78-2.05.78-2.83 0L3.97 15.85c-.78-.78-.78-2.05 0-2.83L12.71 4.28c.39-.39.9-.59 1.41-.59.51 0 1.02.2 1.41.59zM13.41 5.69L6.1 13h7.31l7.31-7.31-7.31-7.31z"/></svg>
                </button>
                <div className="tool-divider" />
                <button className={`tool-btn ${tool === TOOLS.LINE ? 'active' : ''}`} onClick={() => setTool(TOOLS.LINE)} title="Линия">
                    <div style={{width: 20, height: 2, background: 'currentColor', transform: 'rotate(-45deg)'}} />
                </button>
                <button className={`tool-btn ${tool === TOOLS.RECT ? 'active' : ''}`} onClick={() => setTool(TOOLS.RECT)} title="Прямоугольник">
                    <div style={{width: 16, height: 12, border: '2px solid currentColor'}} />
                </button>
                <button className={`tool-btn ${tool === TOOLS.CIRCLE ? 'active' : ''}`} onClick={() => setTool(TOOLS.CIRCLE)} title="Круг">
                    <div style={{width: 16, height: 16, border: '2px solid currentColor', borderRadius: '50%'}} />
                </button>
                <div className="tool-divider" />
                <button className="tool-btn danger" onClick={clearCanvas} title="Очистить всё">
                    <TrashIcon size={20} />
                </button>
            </div>

            {}
            <div className="studio-main">
                <div className="canvas-container">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>

                {}
                <div className="studio-footer">
                    <div className="history-ctrls">
                        <button onClick={() => loadState(historyIndex - 1)} disabled={historyIndex <= 0}>
                            <NavBackIcon size={18} />
                        </button>
                        <button onClick={() => loadState(historyIndex + 1)} disabled={historyIndex >= history.length - 1}>
                            <NavForwardIcon size={18} />
                        </button>
                    </div>

                    <div className="color-palette">
                        {COLORS.map(c => (
                            <div 
                                key={c} 
                                className={`color-item ${color === c ? 'selected' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => { setColor(c); if(tool === TOOLS.ERASER) setTool(TOOLS.PEN); }}
                            />
                        ))}
                    </div>

                    <div className="prop-group">
                        <label>Размер: {size}</label>
                        <input type="range" min="1" max="100" value={size} onChange={e => setSize(parseInt(e.target.value))} />
                    </div>

                    <div className="prop-group">
                        <label>Непрозрачность: {Math.round(opacity * 100)}%</label>
                        <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} />
                    </div>

                    <button className="studio-save-btn" onClick={() => canvasRef.current.toBlob(onSave, 'image/png')}>
                        Готово
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DrawingBoard;