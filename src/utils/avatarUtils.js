
const AVATAR_COLORS = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b', '#78909c'
];

/**
 * Генерирует цвет на основе хеша имени пользователя.
 * Один и тот же юзернейм всегда будет давать один и тот же цвет.
 */
export const getAvatarColor = (name) => {
    if (!name) return '#cfd9de'; 
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash % AVATAR_COLORS.length);
    return AVATAR_COLORS[index];
};

/**
 * Возвращает инициалы (1 или 2 буквы) для отображения в кружке.
 */
export const getInitials = (name) => {
    if (!name) return '?';
    
    const cleanName = name.trim();
    if (cleanName.length === 0) return '?';

    
    const parts = cleanName.split(/\s+/);
    
    if (parts.length > 1) {
        
        const first = parts[0][0];
        const last = parts[parts.length - 1][0];
        
        if (/\p{Emoji}/u.test(first)) return first; 
        
        return (first + last).toUpperCase();
    }
    
    
    return cleanName.slice(0, 1).toUpperCase();
};