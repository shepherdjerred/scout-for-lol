import { z } from "zod";

const IDBOpenDBRequestSchema = z.instanceof(IDBOpenDBRequest);

type UpgradeHandler = (db: IDBDatabase) => void;

/**
 * Open an IndexedDB database with optional upgrade handler
 */
export function openIndexedDB(dbName: string, version: number, upgradeHandler?: UpgradeHandler): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    if (upgradeHandler) {
      request.onupgradeneeded = (event) => {
        const targetResult = IDBOpenDBRequestSchema.safeParse(event.target);
        if (targetResult.success) {
          upgradeHandler(targetResult.data.result);
        }
      };
    }
  });
}

/**
 * Execute an IndexedDB request and return the result
 */
export function executeRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * Execute an IndexedDB request that doesn't return a value
 */
export function executeRequestVoid(request: IDBRequest<IDBValidKey>): Promise<void> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Get an object store from a transaction
 */
export function getStore(transaction: IDBTransaction, storeName: string): IDBObjectStore {
  return transaction.objectStore(storeName);
}
