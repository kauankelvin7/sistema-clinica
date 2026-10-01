import type { Medico, Paciente } from '../types'

const DB_NAME = 'sistema-clinica-directory'
const STORE_NAME = 'snapshots'
const CACHE_KEY = 'active-directory-v1'
const DB_VERSION = 1

export const DIRECTORY_CACHE_TTL_MS = 8 * 60 * 60 * 1000

export interface DirectoryMutation {
  id: string
  queuedAt: number
  paciente: {
    nome: string
    tipo_documento: string
    numero_documento: string
    cargo: string
    empresa: string
  }
  medico: {
    nome: string
    tipo_registro: string
    numero_registro: string
    uf_registro: string
  }
}

export interface DirectorySnapshot {
  version: 1
  cachedAt: number
  patients: Paciente[]
  doctors: Medico[]
  pending: DirectoryMutation[]
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = operation(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function readDirectoryCache(): Promise<DirectorySnapshot | null> {
  if (typeof indexedDB === 'undefined') return null

  try {
    const snapshot = await withStore<DirectorySnapshot | undefined>(
      'readonly',
      (store) => store.get(CACHE_KEY)
    )

    if (!snapshot || snapshot.version !== 1) return null
    if (Date.now() - snapshot.cachedAt > DIRECTORY_CACHE_TTL_MS) {
      await clearDirectoryCache()
      return null
    }

    return {
      ...snapshot,
      pending: Array.isArray(snapshot.pending) ? snapshot.pending : [],
    }
  } catch {
    return null
  }
}

export async function writeDirectoryCache(snapshot: DirectorySnapshot): Promise<void> {
  if (typeof indexedDB === 'undefined') return

  try {
    await withStore<IDBValidKey>('readwrite', (store) => store.put(snapshot, CACHE_KEY))
  } catch {
    // Cache é resiliência; falhas não bloqueiam o sistema.
  }
}

export async function clearDirectoryCache(): Promise<void> {
  if (typeof indexedDB === 'undefined') return

  try {
    await withStore<undefined>('readwrite', (store) => store.delete(CACHE_KEY))
  } catch {
    // Logout continua mesmo se o storage local estiver indisponível.
  }
}
