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
        if (event.target instanceof IDBOpenDBRequest) {
          const db = event.target.result;
          if (db) {
            upgradeHandler(db);
          }
        }
      };
    }
  });
}

/**
 * Execute an IndexedDB request and return the result
 */
export function executeRequest<T>(request: IDBRequest<T>): Promise<T>;
export function executeRequest(request: IDBRequest<IDBValidKey>): Promise<void>;
export function executeRequest<T>(request: IDBRequest<T>): Promise<T | void> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error("IndexedDB operation failed"));
    };

    request.onsuccess = () => {
      const result = request.result;
      if (result !== undefined) {
        resolve(result);
      } else {
        resolve(undefined);
      }
    };
  });
}

/**
 * Execute an IndexedDB request that doesn't return a value
 * @deprecated Use executeRequest instead
 */
export function executeRequestVoid(request: IDBRequest<IDBValidKey>): Promise<void> {
  return executeRequest(request);
}

/**
 * Get an object store from a transaction
 */
export function getStore(transaction: IDBTransaction, storeName: string): IDBObjectStore {
  return transaction.objectStore(storeName);
}
