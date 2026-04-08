import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  body: string | null;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

interface OfflineDB extends DBSchema {
  offlineQueue: {
    key: string;
    value: OfflineRequest;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('impulse-offline-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
};

export const offlineDB = {
  async enqueueRequest(req: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount'>) {
    const db = await getDB();
    const id = crypto.randomUUID();
    
    // Inject client_id if body is a JSON string, to aid in idempotence at the backend
    let finalBody = req.body;
    if (finalBody && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
      try {
        const parsed = JSON.parse(finalBody);
        // Only inject if it's an object and doesn't already have one
        if (parsed && typeof parsed === 'object' && !parsed.client_id) {
          parsed.client_id = id;
          finalBody = JSON.stringify(parsed);
        }
      } catch (e) {
        // Not a JSON object or parsing failed, ignore
      }
    }

    const payload: OfflineRequest = {
      ...req,
      body: finalBody,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await db.put('offlineQueue', payload);
    return payload;
  },

  async getQueue(): Promise<OfflineRequest[]> {
    const db = await getDB();
    // Get all items ordered by timestamp
    return await db.getAllFromIndex('offlineQueue', 'by-timestamp');
  },

  async removeFromQueue(id: string) {
    const db = await getDB();
    await db.delete('offlineQueue', id);
  },

  async incrementRetry(id: string) {
    const db = await getDB();
    const item = await db.get('offlineQueue', id);
    if (item) {
      item.retryCount += 1;
      await db.put('offlineQueue', item);
    }
  },

  async clearQueue() {
    const db = await getDB();
    await db.clear('offlineQueue');
  }
};
