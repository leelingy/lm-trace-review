// IndexedDB wrapper for LM Trace Review

const DB_NAME = 'lm-trace-review-db';
const DB_VERSION = 1;

// Object stores
const STORES = {
  DATASETS: 'datasets',
  TRACES: 'traces',
  COMMENTS: 'comments',
  CONFIG: 'config'
};

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Datasets store
        if (!db.objectStoreNames.contains(STORES.DATASETS)) {
          const datasetStore = db.createObjectStore(STORES.DATASETS, { keyPath: 'id', autoIncrement: true });
          datasetStore.createIndex('name', 'name', { unique: false });
          datasetStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Traces store
        if (!db.objectStoreNames.contains(STORES.TRACES)) {
          const traceStore = db.createObjectStore(STORES.TRACES, { keyPath: 'id', autoIncrement: true });
          traceStore.createIndex('trace_id', 'trace_id', { unique: false });
          traceStore.createIndex('dataset_id', 'dataset_id', { unique: false });
          traceStore.createIndex('date', 'date', { unique: false });
        }

        // Comments store
        if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
          const commentStore = db.createObjectStore(STORES.COMMENTS, { keyPath: 'id', autoIncrement: true });
          commentStore.createIndex('trace_id', 'trace_id', { unique: false });
          commentStore.createIndex('dataset_id', 'dataset_id', { unique: false });
          commentStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Config store (for trace tags)
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
        }
      };
    });
  }

  // Generic CRUD operations
  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
const db = new Database();

export { db, STORES };
