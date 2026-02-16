/* @source BannerEditorModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';
import { apiClient } from '../../api/client';
import '../../styles/BannerEditorModal.css';

const BannerEditorModal = ({ onSaveSuccess }) => {
    const { closeModal } = useModal();
    const [activeTab, setActiveTab] = useState('image'); 
    const [image, setImage] = useState(null);
    const [imageMeta, setImageMeta] = useState({ w: 0, h: 0 });
    const [isSaving, setIsSaving] = useState(false);

    
    const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 24.7 }); 
    const [dragging, setDragging] = useState(false);
    const [dragType, setDragType] = useState('move'); 

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    const ASPECT_RATIO = 3.24; 

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    setImage(ev.target.result);
                    setImageMeta({ w: img.width, h: img.height });
                    
                    setCrop({ x: 5, y: 5, width: 90, height: 90 / ASPECT_RATIO });
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMouseDown = (e, type) => {
        e.stopPropagation();
        setDragging(true);
        setDragType(type);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            let mouseX = ((e.clientX - rect.left) / rect.width) * 100;
            let mouseY = ((e.clientY - rect.top) / rect.height) * 100;

            setCrop(prev => {
                let next = { ...prev };
                if (dragType === 'move') {
                    next.x = Math.max(0, Math.min(mouseX - next.width / 2, 100 - next.width));
                    next.y = Math.max(0, Math.min(mouseY - next.height / 2, 100 - next.height));
                } else if (dragType === 'resize') {
                    const newWidth = Math.max(20, Math.min(mouseX - next.x, 100 - next.x));
                    next.width = newWidth;
                    next.height = newWidth / ASPECT_RATIO;
                    
                    if (next.y + next.height > 100) {
                        next.height = 100 - next.y;
                        next.width = next.height * ASPECT_RATIO;
                    }
                }
                return next;
            });
        };

        const handleMouseUp = () => setDragging(false);

        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, dragType]);

    const handleSave = async () => {
        if (!image) return;
        setIsSaving(true);

        const img = new Image();
        img.src = image;
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1296;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');

            
            const realX = (crop.x / 100) * img.width;
            const realY = (crop.y / 100) * img.height;
            const realW = (crop.width / 100) * img.width;
            const realH = (crop.height / 100) * img.height;

            ctx.drawImage(img, realX, realY, realW, realH, 0, 0, 1296, 400);

            canvas.toBlob(async (blob) => {
                const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
                const res = await apiClient.uploadFile(file);
                if (res?.data?.id) {
                    await apiClient.updateProfile({ bannerId: res.data.id });
                    onSaveSuccess(res.data.url);
                    closeModal();
                }
                setIsSaving(false);
            }, 'image/jpeg', 0.9);
        };
    };

    return (
        <div className="modern-cropper">
            <div className="cropper-header">
                <div className="tabs-container">
                    <button className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`} onClick={() => setActiveTab('draw')}>Рисовать</button>
                    <button className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>Изображение</button>
                </div>
                <button className="close-x" onClick={closeModal}>✕</button>
            </div>

            <div className="cropper-body">
                <p className="hint-text">
                    Настройте область отображения баннера. GIF загружаются без кадрирования.
                </p>

                <div className="work-area" ref={containerRef}>
                    {!image ? (
                        <div className="upload-placeholder" onClick={() => fileInputRef.current.click()}>
                            <span>Нажмите, чтобы выбрать изображение</span>
                        </div>
                    ) : (
                        <div className="image-container">
                            <img src={image} alt="" className="source-image" />
                            
                            {}
                            <div className="cropper-overlay">
                                <div 
                                    className="crop-box" 
                                    style={{ 
                                        left: `${crop.x}%`, 
                                        top: `${crop.y}%`, 
                                        width: `${crop.width}%`, 
                                        height: `${crop.height}%` 
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                                >
                                    {}
                                    <div className="grid-line v1"></div>
                                    <div className="grid-line v2"></div>
                                    <div className="grid-line h1"></div>
                                    <div className="grid-line h2"></div>

                                    {}
                                    <div className="handle br" onMouseDown={(e) => handleMouseDown(e, 'resize')}></div>
                                    <div className="handle tl"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept="image/*" />
            </div>

            <div className="cropper-footer">
                <button className="btn-secondary" onClick={closeModal}>Отмена</button>
                <button className="btn-primary" onClick={handleSave} disabled={!image || isSaving}>
                    {isSaving ? '...' : 'Сохранить'}
                </button>
            </div>
        </div>
    );
};

export default BannerEditorModal;