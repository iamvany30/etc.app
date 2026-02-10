import React, { useState, useRef, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import { useUser } from '../../context/UserContext';
import '../../styles/BannerEditorModal.css';

const AvatarEditorModal = ({ onSave }) => {
    const { closeModal } = useModal();
    const { currentUser } = useUser();
    
    const [imageObj, setImageObj] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const CANVAS_SIZE = 400; 
    const TARGET_SIZE = 500; 

    
    const generateSafeHashtag = () => {
        if (!currentUser) return '#avatar_update';
        
        const cleanId = currentUser.id.replace(/[-.]/g, '_');
        const cleanUsername = currentUser.username.replace(/[-.]/g, '_');
        return `#avatar_${cleanUsername}_${cleanId}`;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert("Пожалуйста, выберите изображение.");
                return;
            }
            
            setOriginalFile(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImageObj(img);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (!imageObj || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#16181c';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const imgW = imageObj.width;
        const imgH = imageObj.height;

        const ratio = Math.max(CANVAS_SIZE / imgW, CANVAS_SIZE / imgH);
        const finalRatio = ratio * zoom;
        const newW = imgW * finalRatio;
        const newH = imgH * finalRatio;

        const renderX = (CANVAS_SIZE - newW) / 2 + position.x;
        const renderY = (CANVAS_SIZE - newH) / 2 + position.y;

        ctx.drawImage(imageObj, renderX, renderY, newW, newH);

        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        ctx.beginPath();
        ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(29, 155, 240, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();

    }, [imageObj, zoom, position]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleProcessAndSave = async () => {
        if (!imageObj) return;
        setIsProcessing(true);

        try {
            
            if (originalFile && originalFile.type === 'image/gif') {
                const previewUrl = URL.createObjectURL(originalFile);
                const uniqueHashtag = generateSafeHashtag(); 
                
                onSave(originalFile, previewUrl, uniqueHashtag);
                closeModal();
                return;
            }

            
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = TARGET_SIZE;
            outputCanvas.height = TARGET_SIZE;
            const ctx = outputCanvas.getContext('2d');

            ctx.fillStyle = '#16181c';
            ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

            const imgW = imageObj.width;
            const imgH = imageObj.height;
            const ratio = Math.max(TARGET_SIZE / imgW, TARGET_SIZE / imgH);
            const finalRatio = ratio * zoom;
            
            const nw = imgW * finalRatio;
            const nh = imgH * finalRatio;

            const scaleFactor = TARGET_SIZE / CANVAS_SIZE;
            const rx = (TARGET_SIZE - nw) / 2 + (position.x * scaleFactor);
            const ry = (TARGET_SIZE - nh) / 2 + (position.y * scaleFactor);

            ctx.drawImage(imageObj, rx, ry, nw, nh);

            outputCanvas.toBlob((blob) => {
                if (!blob) {
                    setIsProcessing(false);
                    return;
                }
                
                const optimizedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
                const previewUrl = URL.createObjectURL(blob);
                const uniqueHashtag = generateSafeHashtag(); 

                onSave(optimizedFile, previewUrl, uniqueHashtag);
                closeModal();
                
            }, 'image/jpeg', 0.85);

        } catch (e) {
            console.error(e);
            setIsProcessing(false);
            alert("Ошибка обработки: " + e.message);
        }
    };

    const isGif = originalFile?.type === 'image/gif';

    return (
        <div className="banner-editor">
            <div className="banner-editor-header">
                <h3>Новая аватарка</h3>
            </div>

            <div className="banner-editor-content">
                {!imageObj ? (
                    <div className="banner-upload-area" onClick={() => fileInputRef.current.click()}>
                        <div style={{
                            width: 100, height: 100, borderRadius: '50%', 
                            background: 'var(--color-item-bg)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', marginBottom: 15
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                        </div>
                        <p>Загрузить фото</p>
                    </div>
                ) : (
                    <div className="banner-preview-wrapper" style={{width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: '50%'}}>
                        <canvas 
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ 
                                cursor: isDragging ? 'grabbing' : 'grab',
                                opacity: isGif ? 0.7 : 1,
                                borderRadius: '50%'
                            }}
                        />
                        {isGif && <div className="gif-warning">GIF: анимация сохранится, зум отключен</div>}
                    </div>
                )}

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/png, image/jpeg, image/gif, image/webp" 
                    style={{display: 'none'}} 
                />

                {imageObj && !isGif && (
                    <div className="banner-controls">
                        <label>Зум:</label>
                        <input 
                            type="range" 
                            min="1" 
                            max="3" 
                            step="0.01" 
                            value={zoom} 
                            onChange={(e) => setZoom(parseFloat(e.target.value))} 
                        />
                    </div>
                )}
            </div>

            <div className="banner-editor-footer">
                <button className="cancel-btn" onClick={closeModal} disabled={isProcessing}>Отмена</button>
                <button 
                    className="save-btn" 
                    onClick={handleProcessAndSave} 
                    disabled={!imageObj || isProcessing}
                >
                    {isProcessing ? 'Обработка...' : 'Применить'}
                </button>
            </div>
        </div>
    );
};

export default AvatarEditorModal;