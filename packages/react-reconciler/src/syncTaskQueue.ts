
let SyncQueue: ((...arg: any) => any)[] | null = null

let isFlushingSyncQueue = false
export function scheduleSyncCallback(callback: (...arg: any) => any) {
    if (SyncQueue === null) {
        SyncQueue = [callback]
    } else {
        SyncQueue.push(callback)
    }
}

export function flushSyncCallbacks() {
    if (!isFlushingSyncQueue && SyncQueue) {
        isFlushingSyncQueue = true
        try {
            SyncQueue.forEach((callback => callback()))
        } catch (error) {
            if (__DEV__) {
                console.error('flushSyncCallbacks报错')
            }
        } finally {
            isFlushingSyncQueue = false
            SyncQueue = null
        }
    }
}