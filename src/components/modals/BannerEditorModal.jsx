import React, { useState, useRef, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import { apiClient } from '../../api/client';
import '../../styles/BannerEditorModal.css';

const BannerEditorModal = ({ onSaveSuccess }) => {
    const { closeModal } = useModal();
    const [imageObj, setImageObj] = useState(null);
    
    const [originalFile, setOriginalFile] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 200;
    const TARGET_WIDTH = 1200;
    const TARGET_HEIGHT = 400;

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
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const imgW = imageObj.width;
        const imgH = imageObj.height;

        const ratio = Math.max(CANVAS_WIDTH / imgW, CANVAS_HEIGHT / imgH);
        const finalRatio = ratio * zoom;
        const newW = imgW * finalRatio;
        const newH = imgH * finalRatio;

        const renderX = (CANVAS_WIDTH - newW) / 2 + position.x;
        const renderY = (CANVAS_HEIGHT - newH) / 2 + position.y;

        ctx.drawImage(imageObj, renderX, renderY, newW, newH);

        const avSize = 110;
        const avX = 30;
        const avY = 100;
        
        ctx.strokeStyle = 'rgba(29, 155, 240, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.beginPath();
        ctx.arc(avX + avSize/2, avY + avSize/2, avSize/2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
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

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    
    const uploadAndSave = async (fileToUpload) => {
        const uploadRes = await apiClient.uploadFile(fileToUpload);
        
        if (uploadRes && uploadRes.id) {
            const updateRes = await apiClient.updateProfile({ 
                bannerId: uploadRes.id 
            });
            
            if (updateRes && !updateRes.error) {
                if (onSaveSuccess) onSaveSuccess(uploadRes.url || updateRes.banner);
                closeModal();
            } else {
                alert("Ошибка обновления профиля: " + (updateRes?.error?.message || "Unknown error"));
            }
        } else {
            console.error("Upload failed", uploadRes);
            alert("Ошибка загрузки файла. " + (uploadRes?.error?.message || uploadRes?.error || "Проверьте консоль"));
        }
    };

    const handleSave = async () => {
        if (!imageObj) return;
        setIsSaving(true);

        try {
            
            
            
            if (originalFile && originalFile.type === 'image/gif') {
                await uploadAndSave(originalFile);
                setIsSaving(false);
                return;
            }

            
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = TARGET_WIDTH;
            outputCanvas.height = TARGET_HEIGHT;
            const ctx = outputCanvas.getContext('2d');

            ctx.fillStyle = '#16181c';
            ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

            const imgW = imageObj.width;
            const imgH = imageObj.height;
            const ratio = Math.max(TARGET_WIDTH / imgW, TARGET_HEIGHT / imgH);
            const finalRatio = ratio * zoom;
            
            const nw = imgW * finalRatio;
            const nh = imgH * finalRatio;

            const rx = (TARGET_WIDTH - nw) / 2 + (position.x * 2);
            const ry = (TARGET_HEIGHT - nh) / 2 + (position.y * 2);

            ctx.drawImage(imageObj, rx, ry, nw, nh);

            outputCanvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsSaving(false);
                    alert("Ошибка создания изображения");
                    return;
                }
                const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
                await uploadAndSave(file);
                setIsSaving(false);
            }, 'image/jpeg', 0.9);

        } catch (e) {
            console.error(e);
            setIsSaving(false);
            alert("Критическая ошибка: " + e.message);
        }
    };

    const isGif = originalFile?.type === 'image/gif';

    return (
        <div className="banner-editor">
            <div className="banner-editor-header">
                <h3>Редактор обложки</h3>
            </div>

            <div className="banner-editor-content">
                {!imageObj ? (
                    <div className="banner-upload-area" onClick={() => fileInputRef.current.click()}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p>Нажмите для выбора файла</p>
                        <span>JPG, PNG, GIF</span>
                    </div>
                ) : (
                    <div className="banner-preview-wrapper">
                        <canvas 
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ 
                                cursor: isDragging ? 'grabbing' : 'grab',
                                opacity: isGif ? 0.7 : 1 
                            }}
                        />
                        {isGif && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                pointerEvents: 'none',
                                color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontWeight: 'bold'
                            }}>
                                GIF загружаются без обрезки для сохранения анимации
                            </div>
                        )}
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
                        <label>Масштаб:</label>
                        <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            step="0.01" 
                            value={zoom} 
                            onChange={(e) => setZoom(parseFloat(e.target.value))} 
                        />
                    </div>
                )}
            </div>

            <div className="banner-editor-footer">
                <button className="cancel-btn" onClick={closeModal} disabled={isSaving}>Отмена</button>
                <button 
                    className="save-btn" 
                    onClick={handleSave} 
                    disabled={!imageObj || isSaving}
                >
                    {isSaving ? 'Сохранение...' : (isGif ? 'Загрузить GIF' : 'Сохранить')}
                </button>
            </div>
        </div>
    );
};

export default BannerEditorModal;