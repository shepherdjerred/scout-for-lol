/**
 * IndexedDB operation helpers to reduce duplication
 */

/**
 * Execute an IndexedDB operation with proper error handling
 * Wraps the common pattern of creating a promise from an IDBRequest
 */
export function executeIDBRequest<T>(request: IDBRequest<T>, operationName = "IndexedDB operation"): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error(`${operationName} failed`));
    };
  });
}

/**
 * Execute an IndexedDB transaction operation
 * Creates a transaction, gets the store, and executes the operation
 */
export async function executeIDBTransaction<T>(options: {
  db: IDBDatabase;
  storeName: string;
  mode: IDBTransactionMode;
  operation: (store: IDBObjectStore) => IDBRequest<T>;
  operationName?: string;
}): Promise<T> {
  const { db, storeName, mode, operation, operationName = "IndexedDB transaction" } = options;
  const transaction = db.transaction([storeName], mode);
  const store = transaction.objectStore(storeName);
  const request = operation(store);
  return executeIDBRequest(request, operationName);
}

/**
 * Execute an IndexedDB cursor operation
 * Iterates through all entries matching the cursor
 */
export async function executeIDBCursor(
  index: IDBIndex,
  operation: (cursor: IDBCursorWithValue, entry: unknown) => boolean | undefined,
  operationName = "IndexedDB cursor",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = index.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target).result;
      if (cursor) {
        const result = operation(cursor, cursor.value as unknown);
        if (result === false) {
          // Stop iteration if operation returns false
          resolve();
        } else {
          cursor.continue();
        }
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      const error = request.error;
      reject(error ?? new Error(`${operationName} failed`));
    };
  });
}
