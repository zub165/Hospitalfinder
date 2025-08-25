// Simple client-side sync of selected localStorage keys to a backend.
// If the backend is unavailable, all functions silently no-op.

(function () {
    const STORAGE_KEYS = [
        'erUsers',
        'currentUser',
        'registeredUsers',
        'symptomsData',
        'chatLearningPatterns',
        'responseEffectiveness',
        'symptomPatterns',
        'chatHistory',
        'theme',
        'hospitalFeedback'
    ];

    const DEFAULT_SYNC_INTERVAL_MS = 60 * 1000; // 1 minute

    // Configure this to your backend base when ready
    const STORAGE_API_BASE = window.STORAGE_API_BASE || '';

    function getOrCreateDeviceId() {
        const key = 'deviceId';
        let id = localStorage.getItem(key);
        if (!id) {
            id = crypto.randomUUID ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(16).slice(2));
            localStorage.setItem(key, id);
        }
        return id;
    }

    function collectSnapshot() {
        const snapshot = {};
        STORAGE_KEYS.forEach(k => {
            const v = localStorage.getItem(k);
            if (v != null) snapshot[k] = v;
        });
        return snapshot;
    }

    async function syncToServer() {
        if (!STORAGE_API_BASE) return; // no backend configured
        try {
            const payload = {
                deviceId: getOrCreateDeviceId(),
                at: new Date().toISOString(),
                data: collectSnapshot()
            };
            await fetch(`${STORAGE_API_BASE}/storage/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Some backends expect a { payload } wrapper; send both-compatible shape
                body: JSON.stringify({ payload, ...payload }),
                mode: 'cors'
            });
        } catch (e) {
            // ignore
        }
    }

    async function loadFromServer() {
        if (!STORAGE_API_BASE) return; // no backend configured
        try {
            const deviceId = getOrCreateDeviceId();
            const res = await fetch(`${STORAGE_API_BASE}/storage/load?deviceId=${encodeURIComponent(deviceId)}`, {
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });
            if (!res.ok) return;
            const json = await res.json();
            const dataObj = json && (json.data || (json.payload && json.payload.data));
            if (dataObj && typeof dataObj === 'object') {
                Object.entries(dataObj).forEach(([k, v]) => {
                    if (STORAGE_KEYS.includes(k) && typeof v === 'string') {
                        localStorage.setItem(k, v);
                    }
                });
            }
        } catch (e) {
            // ignore
        }
    }

    function startAutoSync(intervalMs = DEFAULT_SYNC_INTERVAL_MS) {
        if (!STORAGE_API_BASE) return; // no backend configured
        setInterval(syncToServer, intervalMs);
        window.addEventListener('beforeunload', () => {
            navigator.sendBeacon && navigator.sendBeacon(`${STORAGE_API_BASE}/storage/save`, new Blob([JSON.stringify({
                deviceId: getOrCreateDeviceId(),
                at: new Date().toISOString(),
                data: collectSnapshot()
            })], { type: 'application/json' }));
        });
    }

    window.StorageSync = {
        syncToServer,
        loadFromServer,
        startAutoSync,
        getOrCreateDeviceId
    };

    // Attempt initial load and start periodic sync if configured
    document.addEventListener('DOMContentLoaded', () => {
        loadFromServer().then(() => startAutoSync());
    });
})();


