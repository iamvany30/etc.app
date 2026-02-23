/* @source src/components/modals/BannerEditorModal.jsx */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useModalStore } from '../../store/modalStore';
import { apiClient } from '../../api/client';
import DrawingBoard from '../DrawingBoard';
import { 
    Upload, Pallete, 
    MagniferZoomIn, CheckCircle,
    Maximize, MagicStick3, TrashBinMinimalistic, AddCircle
} from "@solar-icons/react";
import '../../styles/BannerEditorModal.css';


const GRADIENT_PRESETS = [
    { name: 'Sunset', type: 'linear', angle: 45, stops: [{ color: '#FF512F', pos: 0 }, { color: '#DD2476', pos: 100 }] },
    { name: 'Ocean', type: 'linear', angle: 180, stops: [{ color: '#2193b0', pos: 0 }, { color: '#6dd5ed', pos: 100 }] },
    { name: 'Neon', type: 'linear', angle: 90, stops: [{ color: '#8E2DE2', pos: 0 }, { color: '#4A00E0', pos: 100 }] },
    { name: 'Aurora', type: 'linear', angle: 135, stops: [{ color: '#00c6ff', pos: 0 }, { color: '#0072ff', pos: 100 }] },
    { name: 'Toxic', type: 'radial', angle: 0, stops: [{ color: '#a8ff78', pos: 0 }, { color: '#78ffd6', pos: 100 }] },
    { name: 'Dark', type: 'linear', angle: 60, stops: [{ color: '#232526', pos: 0 }, { color: '#414345', pos: 100 }] },
];

const BannerEditorModal = ({ onSaveSuccess }) => {
    const closeModal = useModalStore(state => state.closeModal);
    
    
    const [mode, setMode] = useState('upload'); 
    const [imageSrc, setImageSrc] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    
    const [zoom, setZoom] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    
    const [gradType, setGradType] = useState('linear'); 
    const [gradAngle, setGradAngle] = useState(135);
    const [gradStops, setGradStops] = useState([
        { id: 1, color: '#1d9bf0', pos: 0 },
        { id: 2, color: '#794bc4', pos: 100 }
    ]);

    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);
    const gradientCanvasRef = useRef(null);

    
    const CROP_ASPECT = 3.24; 
    const EXPORT_WIDTH = 1296;
    const EXPORT_HEIGHT = 400;

    

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImageSrc(ev.target.result);
            setMode('crop');
        };
        reader.readAsDataURL(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    };

    

    const getCropRect = () => {
        if (!containerRef.current) return { width: 0, height: 0, left: 0, top: 0 };
        const { clientWidth, clientHeight } = containerRef.current;
        const marginX = 20; 
        const maxWidth = clientWidth - (marginX * 2);
        let width = maxWidth;
        let height = width / CROP_ASPECT;
        if (height > clientHeight - 40) {
            height = clientHeight - 40;
            width = height * CROP_ASPECT;
        }
        const left = (clientWidth - width) / 2;
        const top = (clientHeight - height) / 2;
        return { width, height, left, top };
    };

    const clampPan = (x, y, currentZoom) => {
        if (!imgRef.current) return { x, y };
        const crop = getCropRect();
        const imgW = imgRef.current.naturalWidth * currentZoom;
        const imgH = imgRef.current.naturalHeight * currentZoom;
        const maxPanX = crop.left;
        const minPanX = crop.left + crop.width - imgW;
        const maxPanY = crop.top;
        const minPanY = crop.top + crop.height - imgH;
        return {
            x: Math.min(Math.max(x, minPanX), maxPanX),
            y: Math.min(Math.max(y, minPanY), maxPanY)
        };
    };

    const initImage = useCallback(() => {
        if (!imgRef.current || !containerRef.current) return;
        const crop = getCropRect();
        const natW = imgRef.current.naturalWidth;
        const natH = imgRef.current.naturalHeight;
        const zoomCoverWidth = crop.width / natW;
        const zoomCoverHeight = crop.height / natH;
        const newMinZoom = Math.max(zoomCoverWidth, zoomCoverHeight);
        setMinZoom(newMinZoom);
        setZoom(newMinZoom);
        const initialX = crop.left - (natW * newMinZoom - crop.width) / 2;
        const initialY = crop.top - (natH * newMinZoom - crop.height) / 2;
        setPan({ x: initialX, y: initialY });
    }, []);

    useEffect(() => {
        if (mode === 'crop') {
            const timer = setTimeout(initImage, 100);
            window.addEventListener('resize', initImage);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', initImage);
            };
        }
    }, [mode, imageSrc, initImage]);

    const handleMouseDown = (e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
    const handleMouseMove = (e) => { if (!isDragging) return; e.preventDefault(); const newX = e.clientX - dragStart.x; const newY = e.clientY - dragStart.y; setPan(clampPan(newX, newY, zoom)); };
    const handleMouseUp = () => setIsDragging(false);
    const handleWheel = (e) => {
        if (mode !== 'crop') return;
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.min(Math.max(zoom + delta, minZoom), minZoom * 4);
        setZoom(newZoom);
        setPan(prev => clampPan(prev.x, prev.y, newZoom));
    };

    

    const updateGradientCanvas = useCallback(() => {
        const canvas = gradientCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        let gradient;
        if (gradType === 'linear') {
            
            const angleRad = (gradAngle - 90) * (Math.PI / 180);
            const x1 = w / 2 + Math.cos(angleRad) * w / 2;
            const y1 = h / 2 + Math.sin(angleRad) * h / 2;
            const x2 = w / 2 + Math.cos(angleRad + Math.PI) * w / 2;
            const y2 = h / 2 + Math.sin(angleRad + Math.PI) * h / 2;
            gradient = ctx.createLinearGradient(x2, y2, x1, y1);
        } else {
            gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 1.5);
        }

        
        const sortedStops = [...gradStops].sort((a, b) => a.pos - b.pos);
        sortedStops.forEach(stop => {
            gradient.addColorStop(stop.pos / 100, stop.color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }, [gradType, gradAngle, gradStops]);

    useEffect(() => {
        if (mode === 'gradient') {
            updateGradientCanvas();
        }
    }, [mode, gradType, gradAngle, gradStops, updateGradientCanvas]);

    const addStop = () => {
        if (gradStops.length >= 5) return;
        const newId = Math.max(...gradStops.map(s => s.id)) + 1;
        setGradStops([...gradStops, { id: newId, color: '#ffffff', pos: 50 }]);
    };

    const removeStop = (id) => {
        if (gradStops.length <= 2) return;
        setGradStops(gradStops.filter(s => s.id !== id));
    };

    const updateStop = (id, field, value) => {
        setGradStops(gradStops.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const applyPreset = (preset) => {
        setGradType(preset.type);
        setGradAngle(preset.angle);
        setGradStops(preset.stops.map((s, i) => ({ ...s, id: i })));
    };

    

    const uploadBlob = async (blob, filename) => {
        const file = new File([blob], filename, { type: "image/jpeg" });
        try {
            const res = await apiClient.uploadFile(file);
            if (res?.data?.id) {
                await apiClient.updateProfile({ bannerId: res.data.id });
                onSaveSuccess(res.data.url);
                closeModal();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCrop = () => {
        if (!imgRef.current) return;
        setIsSaving(true);
        const canvas = document.createElement('canvas');
        canvas.width = EXPORT_WIDTH;
        canvas.height = EXPORT_HEIGHT;
        const ctx = canvas.getContext('2d');
        const crop = getCropRect();
        const img = imgRef.current;
        const relativeX = pan.x - crop.left;
        const relativeY = pan.y - crop.top;
        const sourceX = Math.abs(relativeX) / zoom;
        const sourceY = Math.abs(relativeY) / zoom;
        const sourceW = crop.width / zoom;
        const sourceH = crop.height / zoom;
        ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
        canvas.toBlob(blob => uploadBlob(blob, "banner.jpg"), 'image/jpeg', 0.95);
    };

    const handleSaveGradient = () => {
        setIsSaving(true);
        if (gradientCanvasRef.current) {
            gradientCanvasRef.current.toBlob(blob => uploadBlob(blob, "gradient_banner.jpg"), 'image/jpeg', 0.95);
        }
    };

    const handleSaveDrawing = (blob) => {
        setIsSaving(true);
        uploadBlob(blob, "banner_draw.png");
    };

    const cropStyle = containerRef.current ? getCropRect() : { width: '80%', height: 100, left: '10%', top: 50 };

    return (
        <div className="banner-modal-root">
            <div className="bm-content">
                
                {}
                {mode === 'upload' && (
                    <div className="bm-upload-container">
                        <h2 className="bm-title">Обложка профиля</h2>
                        <p className="bm-subtitle">Создайте уникальный стиль своего профиля</p>

                        <div 
                            className="bm-upload-zone"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                            <div className="bm-upload-icon"><Upload size={48} variant="Bold" /></div>
                            <h4>Загрузить изображение</h4>
                            <span>Рекомендуемый размер 1296x400</span>
                        </div>

                        <div className="bm-divider"><span>ИЛИ СОЗДАТЬ</span></div>

                        <div className="bm-actions-grid">
                            <button className="bm-action-card" onClick={(e) => { e.stopPropagation(); setMode('gradient'); }}>
                                <MagicStick3 size={28} color="#FFD700" variant="Bold" />
                                <span>Градиент</span>
                            </button>
                            <button className="bm-action-card" onClick={(e) => { e.stopPropagation(); setMode('draw'); }}>
                                <Pallete size={28} color="#1d9bf0" variant="Bold" />
                                <span>Рисунок</span>
                            </button>
                        </div>
                    </div>
                )}

                {}
                {mode === 'crop' && imageSrc && (
                    <div className="bm-crop-interface">
                        <h2 className="bm-title">Кадрирование</h2>
                        <p className="bm-subtitle">Перетащите для выбора области</p>
                        
                        <div 
                            className="bm-crop-workspace" 
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                        >
                            <img 
                                ref={imgRef}
                                src={imageSrc}
                                alt="Source"
                                className="bm-source-image"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }}
                                onLoad={initImage}
                                draggable={false}
                            />
                            <div className="bm-mask-overlay">
                                <div className="bm-crop-hole" style={{ width: cropStyle.width, height: cropStyle.height, left: cropStyle.left, top: cropStyle.top }}>
                                    <div className="bm-grid-lines"><div className="hl h1"/><div className="hl h2"/><div className="vl v1"/><div className="vl v2"/></div>
                                </div>
                            </div>
                        </div>

                        <div className="bm-controls">
                            <div className="bm-slider-row">
                                <button className="bm-icon-btn" onClick={initImage} title="Сброс"><Maximize size={20}/></button>
                                <MagniferZoomIn size={20} className="bm-zoom-icon" />
                                <input type="range" min={minZoom} max={minZoom * 4} step="0.01" value={zoom} onChange={(e) => { const z = parseFloat(e.target.value); setZoom(z); setPan(prev => clampPan(prev.x, prev.y, z)); }} />
                            </div>
                            <div className="bm-buttons-row">
                                <button className="bm-btn-outline" onClick={() => setMode('upload')} disabled={isSaving}>Назад</button>
                                <button className="bm-btn-primary" onClick={handleSaveCrop} disabled={isSaving}>
                                    {isSaving ? <span className="bm-spinner" /> : <CheckCircle size={20} />}
                                    <span>Применить</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {}
                {mode === 'gradient' && (
                    <div className="bm-gradient-interface">
                        <h2 className="bm-title">Создание градиента</h2>
                        
                        <div className="gradient-preview-container">
                            <canvas 
                                ref={gradientCanvasRef} 
                                width={1296} 
                                height={400} 
                                className="gradient-canvas-preview"
                            />
                        </div>

                        <div className="gradient-controls-scroll custom-scrollbar">
                            <div className="grad-section">
                                <label>Тип</label>
                                <div className="grad-type-toggle">
                                    <button className={gradType === 'linear' ? 'active' : ''} onClick={() => setGradType('linear')}>Linear</button>
                                    <button className={gradType === 'radial' ? 'active' : ''} onClick={() => setGradType('radial')}>Radial</button>
                                </div>
                            </div>

                            {gradType === 'linear' && (
                                <div className="grad-section">
                                    <label>Угол: {gradAngle}°</label>
                                    <input 
                                        type="range" min="0" max="360" 
                                        value={gradAngle} 
                                        onChange={(e) => setGradAngle(parseInt(e.target.value))} 
                                        className="grad-slider"
                                    />
                                </div>
                            )}

                            <div className="grad-section">
                                <label>Цвета</label>
                                <div className="grad-stops-list">
                                    {gradStops.map((stop, index) => (
                                        <div key={stop.id} className="grad-stop-row">
                                            <input 
                                                type="color" 
                                                value={stop.color} 
                                                onChange={(e) => updateStop(stop.id, 'color', e.target.value)}
                                                className="grad-color-picker"
                                            />
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={stop.pos} 
                                                onChange={(e) => updateStop(stop.id, 'pos', parseInt(e.target.value))}
                                                className="grad-pos-slider"
                                            />
                                            <span className="grad-pos-val">{stop.pos}%</span>
                                            {gradStops.length > 2 && (
                                                <button className="grad-remove-btn" onClick={() => removeStop(stop.id)}>
                                                    <TrashBinMinimalistic size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {gradStops.length < 5 && (
                                        <button className="grad-add-btn" onClick={addStop}>
                                            <AddCircle size={18} /> Добавить цвет
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grad-section">
                                <label>Пресеты</label>
                                <div className="grad-presets">
                                    {GRADIENT_PRESETS.map((p) => (
                                        <button 
                                            key={p.name} 
                                            className="grad-preset-pill"
                                            onClick={() => applyPreset(p)}
                                            style={{
                                                background: p.type === 'linear' 
                                                    ? `linear-gradient(${p.angle}deg, ${p.stops[0].color}, ${p.stops[1].color})`
                                                    : `radial-gradient(circle, ${p.stops[0].color}, ${p.stops[1].color})`
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bm-draw-footer">
                            <button className="bm-btn-outline" onClick={() => setMode('upload')} disabled={isSaving}>Назад</button>
                            <button className="bm-btn-primary" onClick={handleSaveGradient} disabled={isSaving}>
                                {isSaving ? <span className="bm-spinner" /> : <CheckCircle size={20} />}
                                <span>Сохранить</span>
                            </button>
                        </div>
                    </div>
                )}

                {}
                {mode === 'draw' && (
                    <div className="bm-draw-interface">
                        <h2 className="bm-title">Создание обложки</h2>
                        <DrawingBoard aspectRatio={CROP_ASPECT} onSave={handleSaveDrawing} />
                        <div className="bm-draw-footer">
                            <button className="bm-btn-outline" onClick={() => setMode('upload')} disabled={isSaving}>Отмена</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannerEditorModal;