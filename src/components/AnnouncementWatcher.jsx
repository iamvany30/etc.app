/* @source src/components/AnnouncementWatcher.jsx */
import { useEffect } from 'react';
import { useModalStore } from '../store/modalStore';
import RemoteAnnouncementModal from './modals/RemoteAnnouncementModal';

const JSON_URL = 'https://raw.githubusercontent.com/iamvany30/etc.app_theme/main/announcement.json';

const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const val1 = parts1[i] || 0;
        const val2 = parts2[i] || 0;
        if (val1 > val2) return 1;
        if (val1 < val2) return -1;
    }
    return 0;
};

const AnnouncementWatcher = () => {
    const openModal = useModalStore(state => state.openModal);

    useEffect(() => {
        const check = async () => {
            let data;
            try {
                const res = await fetch(`${JSON_URL}?t=${Date.now()}`);
                if (!res.ok) {
                    console.error(`[Announcement] Fetch failed with status: ${res.status}`);
                    return;
                }
                
                
                
                const text = await res.text();
                if (!text || !text.trim().startsWith('{')) {
                    console.log('[Announcement] Response is not a valid JSON object.');
                    return;
                }
                
                
                try {
                    data = JSON.parse(text);
                } catch (jsonError) {
                    console.error('[Announcement] JSON Parse Error:', jsonError.message);
                    return; 
                }
                

                if (!data || !data.active) return;

                const seenKey = `itd_announce_${data.id}`;
                if (data.rules?.once && localStorage.getItem(seenKey)) return;

                const now = new Date();
                if (data.rules?.startAt && new Date(data.rules.startAt) > now) return;
                if (data.rules?.endAt && new Date(data.rules.endAt) < now) return;

                if (data.rules?.minVersion && window.api) {
                    const currentVer = await window.api.invoke('app:get-version');
                    if (compareVersions(currentVer, data.rules.minVersion) < 0) return;
                }

                setTimeout(() => {
                    openModal(<RemoteAnnouncementModal data={data} idKey={seenKey} />, { variant: 'glass' });
                }, 2000);

            } catch (e) {
                console.error('[Announcement] General Check failed:', e);
            }
        };

        check();
    }, [openModal]);

    return null;
};

export default AnnouncementWatcher;