export const getAverageColor = async (imageUrl) => {
    if (!imageUrl) return null;

    let srcToLoad = imageUrl;
    if (window.api?.invoke) {
        try {
            const base64Data = await window.api.invoke('utils:fetch-base64', imageUrl);
            if (base64Data) srcToLoad = base64Data;
        } catch (e) { console.warn("[ColorUtils] IPC fetch failed", e); }
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = srcToLoad;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 10; 
                canvas.height = 10;
                ctx.drawImage(img, 0, 0, 10, 10);

                
                const p1 = ctx.getImageData(1, 1, 1, 1).data; 
                const p2 = ctx.getImageData(8, 8, 1, 1).data; 

                const color1 = `rgb(${p1[0]}, ${p1[1]}, ${p1[2]})`;
                const color2 = `rgb(${p2[0]}, ${p2[1]}, ${p2[2]})`;

                resolve({ color1, color2 }); 
            } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null);
    });
};