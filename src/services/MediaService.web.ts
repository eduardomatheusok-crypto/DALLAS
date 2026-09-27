// Binary Blobs in IndexedDB, never Base64 in account records or AsyncStorage.
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dallas-media', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function persistImage(uri: string): Promise<string> {
  if (/^(asset:|http|media:)/.test(uri)) return uri;
  const blob = await (await fetch(uri)).blob();
  const key = `media:${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
  return key;
}
const urls = new Map<string, string>();
export async function resolveImage(uri: string): Promise<string> {
  if (!uri.startsWith('media:')) return uri;
  const cached = urls.get(uri);
  if (cached) return cached;
  const db = await database();
  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      const request = db.transaction('images').objectStore('images').get(uri);
      request.onsuccess = () => request.result ? resolve(request.result) : reject(new Error('Imagem não encontrada'));
      request.onerror = () => reject(request.error);
    });
    const url = URL.createObjectURL(blob);
    urls.set(uri, url);
    return url;
  } finally { db.close(); }
}
