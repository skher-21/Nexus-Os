import type { NexusFile } from './types';

const DB_NAME = 'nexus-os';
const DB_VERSION = 1;
const STORE = 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const VirtualFS = {
  async list(parentId: string | null): Promise<NexusFile[]> {
    const store = await tx('readonly');
    const all = await reqToPromise(store.getAll());
    return (all as NexusFile[])
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  },

  async getAll(): Promise<NexusFile[]> {
    const store = await tx('readonly');
    return reqToPromise(store.getAll());
  },

  async get(id: string): Promise<NexusFile | undefined> {
    const store = await tx('readonly');
    return reqToPromise(store.get(id));
  },

  async create(
    input: Omit<NexusFile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NexusFile> {
    const now = Date.now();
    const file: NexusFile = { ...input, id: uid(), createdAt: now, updatedAt: now };
    const store = await tx('readwrite');
    await reqToPromise(store.add(file));
    return file;
  },

  async update(id: string, patch: Partial<NexusFile>): Promise<void> {
    const store = await tx('readwrite');
    const existing = await reqToPromise(store.get(id));
    if (!existing) throw new Error('File not found');
    const updated: NexusFile = {
      ...(existing as NexusFile),
      ...patch,
      id,
      updatedAt: Date.now(),
    };
    await reqToPromise(store.put(updated));
  },

  async remove(id: string): Promise<void> {
    const store = await tx('readwrite');
    // recursively delete children
    const all = (await reqToPromise(store.getAll())) as NexusFile[];
    const toDelete: string[] = [id];
    const collect = (pid: string) => {
      all
        .filter((f) => f.parentId === pid)
        .forEach((c) => {
          toDelete.push(c.id);
          if (c.type === 'folder') collect(c.id);
        });
    };
    collect(id);
    await Promise.all(toDelete.map((d) => reqToPromise(store.delete(d))));
  },

  async rename(id: string, name: string): Promise<void> {
    await this.update(id, { name });
  },

  async move(id: string, parentId: string | null): Promise<void> {
    await this.update(id, { parentId });
  },

  async copy(id: string, parentId: string | null): Promise<NexusFile | null> {
    const store = await tx('readwrite');
    const all = (await reqToPromise(store.getAll())) as NexusFile[];
    const orig = all.find((f) => f.id === id);
    if (!orig) return null;
    const clone = async (f: NexusFile, pid: string | null): Promise<NexusFile> => {
      const now = Date.now();
      const copy: NexusFile = {
        ...f,
        id: uid(),
        name: f.name,
        parentId: pid,
        createdAt: now,
        updatedAt: now,
      };
      await reqToPromise(store.put(copy));
      const children = all.filter((c) => c.parentId === f.id);
      for (const c of children) {
        await clone(c, copy.id);
      }
      return copy;
    };
    return clone(orig, parentId);
  },

  async storageStats(): Promise<{ count: number; bytes: number }> {
    const all = await this.getAll();
    const bytes = all.reduce((sum, f) => {
      return sum + new Blob([f.content ?? '', f.name]).size;
    }, 0);
    return { count: all.length, bytes };
  },

  async seedDefaults(): Promise<void> {
    const all = await this.getAll();
    if (all.length > 0) return;
    const now = Date.now();
    const folders = ['Documents', 'Projects', 'Experiments', 'Downloads', 'Pictures'];
    const store = await tx('readwrite');
    for (const name of folders) {
      const folder: NexusFile = {
        id: uid(),
        name,
        type: 'folder',
        parentId: null,
        createdAt: now,
        updatedAt: now,
      };
      await reqToPromise(store.put(folder));
      if (name === 'Documents') {
        const readme: NexusFile = {
          id: uid(),
          name: 'welcome.txt',
          type: 'file',
          parentId: folder.id,
          content:
            'NEXUS OS — Beyond the Desktop\n\nWelcome to your research workstation.\nUse NEXUS FILES to manage documents, NEXUS LAB to run scientific simulations, and NEXUS TERMINAL to navigate the virtual filesystem.\n\nAll files persist across refreshes via IndexedDB.',
          mimeType: 'text/plain',
          createdAt: now,
          updatedAt: now,
        };
        await reqToPromise(store.put(readme));
      }
      if (name === 'Projects') {
        const proj: NexusFile = {
          id: uid(),
          name: 'index.html',
          type: 'file',
          parentId: folder.id,
          content:
            '<!DOCTYPE html>\n<html>\n  <head><title>Hello NEXUS</title></head>\n  <body>\n    <h1>Hello from NEXUS STUDIO</h1>\n    <p>Edit me and preview.</p>\n  </body>\n</html>',
          mimeType: 'text/html',
          createdAt: now,
          updatedAt: now,
        };
        await reqToPromise(store.put(proj));
      }
    }
  },

  async pathOf(id: string): Promise<NexusFile[]> {
    const all = await this.getAll();
    const path: NexusFile[] = [];
    let cur: NexusFile | undefined = all.find((f) => f.id === id);
    while (cur) {
      path.unshift(cur);
      cur = all.find((f) => f.id === cur!.parentId);
    }
    return path;
  },
};
