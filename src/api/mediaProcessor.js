 

class MediaProcessor {
    constructor() {
        this.worker = null;
        this.pendingRequests = new Map();
        this.init();
    }

    init() {
         
         
        this.worker = new Worker(new URL('../workers/media.worker.js', import.meta.url));

        this.worker.onmessage = (e) => {
            const { id, success, file, error } = e.data;
            
            if (this.pendingRequests.has(id)) {
                const { resolve, reject } = this.pendingRequests.get(id);
                this.pendingRequests.delete(id);

                if (success) {
                    resolve(file);
                } else {
                    console.error('Worker Error:', error);
                    reject(new Error(error));
                }
            }
        };

        this.worker.onerror = (err) => {
            console.error("Worker Global Error:", err);
             
            this.pendingRequests.forEach(({ reject }) => {
                reject(err);
            });
            this.pendingRequests.clear();
        };
    }

    /**
     * Отправляет файл на обработку в воркер.
     * @param {File} file 
     * @returns {Promise<File>}
     */
    process(file) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            
            this.pendingRequests.set(id, { resolve, reject });

             
            this.worker.postMessage({
                id,
                file,
            });
        });
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}

 
export const mediaProcessor = new MediaProcessor();
