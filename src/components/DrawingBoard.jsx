/* @source src/components/DrawingBoard.jsx */
import React, { useRef, useState, useEffect } from 'react';
import { TrashIcon, NavBackIcon, NavForwardIcon } from './icons/CommonIcons'; 
import { 
    ToolPanIcon, ToolPenIcon, ToolSprayIcon, ToolFillIcon, ToolEraserIcon,
    ToolPickerIcon, ToolGlobalPickerIcon, ToolLineIcon, ToolArrowIcon, 
    ToolRectIcon, ToolTriangleIcon, ToolCircleIcon, ZoomInIcon, ZoomOutIcon 
} from './icons/CustomIcons';
import ConfirmActionModal from './modals/ConfirmActionModal';
import { useIslandStore } from '../store/islandStore'; 
import '../styles/DrawingBoard.css';

const COLORS = [
    '#ffffff', '#1d9bf0', '#00ba7c', '#f91880', '#ffad1f', 
    '#794bc4', '#f4212e', '#ff7a00', '#000000'
];

const TOOLS = {
    PEN: 'pen',
    SPRAY: 'spray',
    FILL: 'fill',
    ERASER: 'eraser',
    LINE: 'line',
    ARROW: 'arrow',
    RECT: 'rect',
    CIRCLE: 'circle',
    TRIANGLE: 'triangle',
    PICKER: 'picker',
    PAN: 'pan'
};

const rgbToHex = (r, g, b) => {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
};

const hexToRgba = (hex, alpha = 1) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return [r, g, b, Math.round(alpha * 255)];
};

function floodFill(ctx, startX, startY, fillColor, width, height, tolerance = 32) {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const startPos = (startY * width + startX) * 4;
    
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    if (
        Math.abs(startR - fillColor[0]) <= tolerance &&
        Math.abs(startG - fillColor[1]) <= tolerance &&
        Math.abs(startB - fillColor[2]) <= tolerance &&
        Math.abs(startA - fillColor[3]) <= tolerance
    ) {
        return;
    }

    const pixelStack = [[startX, startY]];

    const matchStartColor = (pos) => {
        return (
            Math.abs(data[pos] - startR) <= tolerance &&
            Math.abs(data[pos + 1] - startG) <= tolerance &&
            Math.abs(data[pos + 2] - startB) <= tolerance &&
            Math.abs(data[pos + 3] - startA) <= tolerance
        );
    };

    const colorPixel = (pos) => {
        data[pos] = fillColor[0];
        data[pos + 1] = fillColor[1];
        data[pos + 2] = fillColor[2];
        data[pos + 3] = fillColor[3];
    };

    while (pixelStack.length) {
        const newPos = pixelStack.pop();
        const x = newPos[0];
        let y = newPos[1];
        let pixelPos = (y * width + x) * 4;

        while (y >= 0 && matchStartColor(pixelPos)) {
            y--;
            pixelPos -= width * 4;
        }
        pixelPos += width * 4;
        y++;

        let reachLeft = false;
        let reachRight = false;

        while (y < height && matchStartColor(pixelPos)) {
            colorPixel(pixelPos);

            if (x > 0) {
                if (matchStartColor(pixelPos - 4)) {
                    if (!reachLeft) {
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < width - 1) {
                if (matchStartColor(pixelPos + 4)) {
                    if (!reachRight) {
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }

            y++;
            pixelPos += width * 4;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

const DrawingBoard = ({ onSave, aspectRatio = 3.24 }) => {
    const showIslandAlert = useIslandStore(state => state.showIslandAlert); 
    
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [isSpaceDown, setIsSpaceDown] = useState(false);
    
    const [tool, setTool] = useState(TOOLS.PEN);
    const [color, setColor] = useState('#ffffff');
    const [size, setSize] = useState(5);
    const [opacity, setOpacity] = useState(1);

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [snapshot, setSnapshot] = useState(null);

    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const currentMousePos = useRef({ x: 0, y: 0 });

    const centerCanvas = () => {
        if (containerRef.current && canvasRef.current) {
            const cWidth = containerRef.current.clientWidth;
            const cHeight = containerRef.current.clientHeight;
            
            const baseScale = Math.min((cWidth - 40) / 1600, (cHeight - 40) / (1600 / aspectRatio));
            
            setScale(baseScale);
            setPan({
                x: (cWidth - 1600 * baseScale) / 2,
                y: (cHeight - (1600 / aspectRatio) * baseScale) / 2
            });
        }
    };

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
        setTimeout(centerCanvas, 100);
    }, [aspectRatio]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const scaleAdjust = e.deltaY < 0 ? 1.1 : 0.9;
            
            setScale(prev => {
                const newScale = Math.min(Math.max(0.1, prev * scaleAdjust), 10);
                setPan(prevPan => {
                    const rect = container.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    return {
                        x: mouseX - (mouseX - prevPan.x) * (newScale / prev),
                        y: mouseY - (mouseY - prevPan.y) * (newScale / prev)
                    };
                });
                return newScale;
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !e.repeat) {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setIsSpaceDown(true);
                }
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                setIsSpaceDown(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        let raf;
        const sprayLoop = () => {
            if (isDrawing && tool === TOOLS.SPRAY) {
                const ctx = contextRef.current;
                const pos = currentMousePos.current;
                const radius = size * 1.5;
                const density = size * 2;
                
                ctx.fillStyle = color;
                ctx.globalAlpha = opacity;
                
                for (let i = 0; i < density; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius;
                    ctx.fillRect(
                        pos.x + r * Math.cos(angle), 
                        pos.y + r * Math.sin(angle), 
                        1, 1
                    );
                }
            }
            raf = requestAnimationFrame(sprayLoop);
        };
        if (isDrawing && tool === TOOLS.SPRAY) raf = requestAnimationFrame(sprayLoop);
        return () => cancelAnimationFrame(raf);
    }, [isDrawing, tool, size, color, opacity]);

    const adjustZoom = (multiplier) => {
        if (!containerRef.current) return;
        const cWidth = containerRef.current.clientWidth;
        const cHeight = containerRef.current.clientHeight;

        setScale(prev => {
            const newScale = Math.min(Math.max(0.1, prev * multiplier), 10);
            setPan(prevPan => {
                const mouseX = cWidth / 2;
                const mouseY = cHeight / 2;
                return {
                    x: mouseX - (mouseX - prevPan.x) * (newScale / prev),
                    y: mouseY - (mouseY - prevPan.y) * (newScale / prev)
                };
            });
            return newScale;
        });
    };

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

    const handleGlobalPicker = async () => {
        if (!window.EyeDropper) {
            showIslandAlert('error', 'Ваш браузер не поддерживает эту функцию', '❌'); 
            return;
        }
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            setColor(result.sRGBHex);
            setTool(TOOLS.PEN);
        } catch (e) {
            console.log("Global color picker cancelled");
        }
    };

    
    const handlePointerDown = (e) => {
        
        e.preventDefault(); 
        
        
        if (e.pointerId) {
            e.currentTarget.setPointerCapture(e.pointerId);
        }

        if (e.button === 1 || tool === TOOLS.PAN || isSpaceDown) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }

        const pos = getPos(e);
        currentMousePos.current = pos;

        if (tool === TOOLS.PICKER) {
            const pixel = contextRef.current.getImageData(pos.x, pos.y, 1, 1).data;
            setColor(rgbToHex(pixel[0], pixel[1], pixel[2]));
            setTool(TOOLS.PEN);
            return;
        }

        if (tool === TOOLS.FILL) {
            const rgba = hexToRgba(color, opacity);
            floodFill(contextRef.current, Math.floor(pos.x), Math.floor(pos.y), rgba, canvasRef.current.width, canvasRef.current.height);
            saveState();
            return;
        }

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

    const handlePointerMove = (e) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
            return;
        }
        
        const pos = getPos(e);
        currentMousePos.current = pos;

        if (!isDrawing) return;
        
        const ctx = contextRef.current;

        if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (tool !== TOOLS.SPRAY) {
            ctx.putImageData(snapshot, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.globalAlpha = opacity;

            if (tool === TOOLS.LINE) {
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(pos.x, pos.y);
            } else if (tool === TOOLS.ARROW) {
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(pos.x, pos.y);
                const headlen = Math.max(10, size * 2);
                const angle = Math.atan2(pos.y - startPos.y, pos.x - startPos.x);
                ctx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
            } else if (tool === TOOLS.RECT) {
                ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
            } else if (tool === TOOLS.TRIANGLE) {
                ctx.moveTo(startPos.x + (pos.x - startPos.x) / 2, startPos.y);
                ctx.lineTo(startPos.x, pos.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.closePath();
            } else if (tool === TOOLS.CIRCLE) {
                const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
                ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            }
            ctx.stroke();
        }
    };

    const handlePointerUp = (e) => {
        
        if (e && e.pointerId) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        
        if (isPanning) {
            setIsPanning(false);
            return;
        }
        if (isDrawing) {
            setIsDrawing(false);
            saveState();
        }
    };

    const confirmClearCanvas = () => {
        contextRef.current.fillStyle = '#000000';
        contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        saveState();
        setShowClearConfirm(false);
    };

    const isPanMode = tool === TOOLS.PAN || isSpaceDown;
    let cursorStyle = 'crosshair';
    if (isPanning) cursorStyle = 'grabbing';
    else if (isPanMode) cursorStyle = 'grab';
    else if (tool === TOOLS.PICKER) cursorStyle = 'crosshair';
    else if (tool === TOOLS.FILL) cursorStyle = 'crosshair'; 

    return (
        <div className="drawing-studio">
            {showClearConfirm && (
                <div className="drawing-local-modal-overlay">
                    <div className="drawing-local-modal">
                        <ConfirmActionModal
                            title="Очистить холст?"
                            message="Вы уверены, что хотите удалить весь рисунок?"
                            confirmText="Очистить"
                            onConfirm={confirmClearCanvas}
                            onCancel={() => setShowClearConfirm(false)}
                            isDanger={true}
                        />
                    </div>
                </div>
            )}

            <div className="studio-sidebar custom-scrollbar-minimal">
                <button className={`tool-btn ${tool === TOOLS.PAN ? 'active' : ''}`} onClick={() => setTool(TOOLS.PAN)} title="Перемещение (Пробел)">
                    <ToolPanIcon />
                </button>
                <div className="tool-divider" />
                <button className={`tool-btn ${tool === TOOLS.PEN ? 'active' : ''}`} onClick={() => setTool(TOOLS.PEN)} title="Кисть">
                    <ToolPenIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.SPRAY ? 'active' : ''}`} onClick={() => setTool(TOOLS.SPRAY)} title="Баллончик">
                    <ToolSprayIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.FILL ? 'active' : ''}`} onClick={() => setTool(TOOLS.FILL)} title="Заливка">
                    <ToolFillIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.ERASER ? 'active' : ''}`} onClick={() => setTool(TOOLS.ERASER)} title="Ластик">
                    <ToolEraserIcon />
                </button>
                <div className="tool-divider" />
                <button className={`tool-btn ${tool === TOOLS.PICKER ? 'active' : ''}`} onClick={() => setTool(TOOLS.PICKER)} title="Пипетка (Холст)">
                    <ToolPickerIcon />
                </button>
                {window.EyeDropper && (
                    <button className="tool-btn" onClick={handleGlobalPicker} title="Пипетка (Весь экран)">
                        <ToolGlobalPickerIcon />
                    </button>
                )}
                <div className="tool-divider" />
                <button className={`tool-btn ${tool === TOOLS.LINE ? 'active' : ''}`} onClick={() => setTool(TOOLS.LINE)} title="Линия">
                    <ToolLineIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.ARROW ? 'active' : ''}`} onClick={() => setTool(TOOLS.ARROW)} title="Стрелка">
                    <ToolArrowIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.RECT ? 'active' : ''}`} onClick={() => setTool(TOOLS.RECT)} title="Прямоугольник">
                    <ToolRectIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.TRIANGLE ? 'active' : ''}`} onClick={() => setTool(TOOLS.TRIANGLE)} title="Треугольник">
                    <ToolTriangleIcon />
                </button>
                <button className={`tool-btn ${tool === TOOLS.CIRCLE ? 'active' : ''}`} onClick={() => setTool(TOOLS.CIRCLE)} title="Круг">
                    <ToolCircleIcon />
                </button>
                <div className="tool-divider" />
                <button className="tool-btn danger" onClick={() => setShowClearConfirm(true)} title="Очистить всё">
                    <TrashIcon size={22} />
                </button>
            </div>

            <div className="studio-main">
                <div 
                    className="canvas-container" 
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: 'none' }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute',
                            transformOrigin: '0 0',
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                            cursor: cursorStyle
                        }}
                    />
                    
                    <div className="zoom-controls">
                        <button onClick={() => adjustZoom(1.2)} title="Приблизить">
                            <ZoomInIcon />
                        </button>
                        <button onClick={centerCanvas} title="Центрировать">
                            {Math.round(scale * 100)}%
                        </button>
                        <button onClick={() => adjustZoom(0.8)} title="Отдалить">
                            <ZoomOutIcon />
                        </button>
                    </div>
                </div>

                <div className="studio-footer custom-scrollbar">
                    <div className="history-ctrls">
                        <button onClick={() => loadState(historyIndex - 1)} disabled={historyIndex <= 0}>
                            <NavBackIcon size={20} />
                        </button>
                        <button onClick={() => loadState(historyIndex + 1)} disabled={historyIndex >= history.length - 1}>
                            <NavForwardIcon size={20} />
                        </button>
                    </div>

                    <div className="color-palette">
                        <input 
                            type="color" 
                            className="color-picker-native"
                            value={color}
                            onChange={(e) => { setColor(e.target.value); if(tool === TOOLS.ERASER || tool === TOOLS.PAN || tool === TOOLS.PICKER) setTool(TOOLS.PEN); }}
                            title="Свой цвет"
                        />
                        {COLORS.map(c => (
                            <div 
                                key={c} 
                                className={`color-item ${color.toLowerCase() === c.toLowerCase() && tool !== TOOLS.ERASER && tool !== TOOLS.PAN && tool !== TOOLS.PICKER ? 'selected' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => { setColor(c); if(tool === TOOLS.ERASER || tool === TOOLS.PAN || tool === TOOLS.PICKER) setTool(TOOLS.PEN); }}
                            />
                        ))}
                    </div>

                    <div className="prop-group">
                        <label>
                            <span>Размер</span>
                            <span>{size}px</span>
                        </label>
                        <input type="range" min="1" max="100" value={size} onChange={e => setSize(parseInt(e.target.value))} />
                    </div>

                    <div className="prop-group">
                        <label>
                            <span>Непрозрачность</span>
                            <span>{Math.round(opacity * 100)}%</span>
                        </label>
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