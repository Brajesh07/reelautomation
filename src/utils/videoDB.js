const DB_NAME = "reelautomation-videos";
const DB_VERSION = 1;
const STORE_NAME = "videos";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: "filename" });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveVideoToDB(video) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    // Store only filename, name and blob — NOT the blob URL (URLs are tab-scoped)
    tx.objectStore(STORE_NAME).put({
      filename: video.filename,
      name: video.name,
      blob: video.blob,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllVideosFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = (e) => {
      // Recreate a fresh blob URL for each stored entry
      const videos = e.target.result.map((entry) => ({
        filename: entry.filename,
        name: entry.name,
        blob: entry.blob,
        url: URL.createObjectURL(entry.blob),
      }));
      resolve(videos);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteVideoFromDB(filename) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(filename);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}
