import localforage from 'localforage';

export interface MediaRecord {
  id: string;
  title: string;
  sourceUrl: string;
  type: 'video' | 'audio';
  mimeType: string;
  size: number;
  duration?: number;
  createdAt: number;
  blob: Blob;
}

export interface MediaMeta {
  id: string;
  title: string;
  sourceUrl: string;
  type: 'video' | 'audio';
  mimeType: string;
  size: number;
  duration?: number;
  createdAt: number;
}

let store: LocalForage | null = null;

function getStore(): LocalForage {
  if (!store) {
    store = localforage.createInstance({
      name: 'video-vault',
      storeName: 'media',
      description: 'Locally stored media blobs and metadata',
    });
  }
  return store;
}

export async function saveMedia(record: MediaRecord): Promise<void> {
  await getStore().setItem(record.id, record);
}

export async function getMedia(id: string): Promise<MediaRecord | null> {
  return (await getStore().getItem<MediaRecord>(id)) ?? null;
}

export async function deleteMedia(id: string): Promise<void> {
  await getStore().removeItem(id);
}

export async function listMedia(): Promise<MediaMeta[]> {
  const items: MediaMeta[] = [];
  await getStore().iterate<MediaRecord, void>((value) => {
    const { blob, ...meta } = value;
    items.push(meta);
  });
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMediaBlobUrl(id: string): Promise<string | null> {
  const record = await getMedia(id);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function estimateStorageUsage(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
