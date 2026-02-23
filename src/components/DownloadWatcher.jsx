/* @source src/components/DownloadWatcher.jsx */
import { useEffect, useRef } from 'react';
import { useDownloadStore } from '../store/downloadStore';
import { useModalStore } from '../store/modalStore';
import DownloadConfirmModal from './modals/DownloadConfirmModal';

const DownloadWatcher = () => {
    const downloads = useDownloadStore(state => state.downloads);
    const openModal = useModalStore(state => state.openModal);
    const processedIds = useRef(new Set());

    useEffect(() => {
        
        const pendingDownload = Object.values(downloads).find(
            item => item.status === 'paused' && !processedIds.current.has(item.id)
        );

        if (pendingDownload) {
            processedIds.current.add(pendingDownload.id);
            openModal(<DownloadConfirmModal downloadItem={pendingDownload} />, { variant: 'glass' });
        }
        
        
        const currentIds = new Set(Object.values(downloads).map(d => d.id));
        for (let id of processedIds.current) {
            if (!currentIds.has(id)) {
                processedIds.current.delete(id);
            }
        }
    }, [downloads, openModal]);

    return null;
};

export default DownloadWatcher;