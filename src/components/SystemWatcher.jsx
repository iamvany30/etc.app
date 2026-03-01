import { useEffect } from 'react';
import { useDownloadStore } from '../store/downloadStore';
import { useUploadStore } from '../store/uploadStore';
import { useMusicStore } from '../store/musicStore';

const SystemWatcher = () => {
    const downloads = useDownloadStore(state => state.downloads);
    const uploads = useUploadStore(state => state.uploads);
    const isPlaying = useMusicStore(state => state.isPlaying);

    
    useEffect(() => {
        if (!window.api?.system) return;

        const activeDownloads = Object.values(downloads);
        const activeUploads = Object.values(uploads).filter(u => u.status !== 'complete' && u.status !== 'error');

        let totalProgress = -1; 
        let mode = 'normal';

        if (activeDownloads.length > 0 || activeUploads.length > 0) {
            let totalPercent = 0;
            let count = 0;

            activeDownloads.forEach(d => {
                if (d.percent > 0) { totalPercent += d.percent; count++; }
                if (d.status === 'paused') mode = 'paused'; 
            });

            activeUploads.forEach(u => {
                
                const p = u.status === 'starting' ? 10 : u.status === 'uploading_audio' ? 50 : u.status === 'creating_post' ? 90 : 20;
                totalPercent += p;
                count++;
            });

            if (count > 0) {
                totalProgress = (totalPercent / count) / 100; 
            } else {
                mode = 'indeterminate'; 
                totalProgress = 2; 
            }
        }

        window.api.system.setProgressBar(totalProgress, mode);

    }, [downloads, uploads]);

    
    useEffect(() => {
        if (window.api?.system?.setThumbarButtons) {
            window.api.system.setThumbarButtons(isPlaying);
        }
    }, [isPlaying]);

    return null;
};

export default SystemWatcher;