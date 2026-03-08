const DB_NAME = 'xiuxian_roguelike_db'
const DB_VERSION = 1

const STORES = {
  SAVES: 'saves',
  SAVE_DATA: 'saveData',
  MEMORIES: 'memories'
} as const

export interface SaveMeta {
  id: string
  name: string
  timestamp: number
  playerLevel: string
  realm: string
  summary: string
}

export interface SaveData {
  saveId: string
  data: Record<string, unknown>
}

export interface MemoryItem {
  id: string
  saveId: string
  type: string
  content: string
  embedding?: number[]
  timestamp: number
  importance: number
}

class Database {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('IndexedDB 打开失败'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORES.SAVES)) {
          const savesStore = db.createObjectStore(STORES.SAVES, { keyPath: 'id' })
          savesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORES.SAVE_DATA)) {
          db.createObjectStore(STORES.SAVE_DATA, { keyPath: 'saveId' })
        }

        if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
          const memoriesStore = db.createObjectStore(STORES.MEMORIES, { keyPath: 'id' })
          memoriesStore.createIndex('saveId', 'saveId', { unique: false })
          memoriesStore.createIndex('timestamp', 'timestamp', { unique: false })
          memoriesStore.createIndex('importance', 'importance', { unique: false })
        }
      }
    })
  }

  private getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly'
  ): IDBObjectStore {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }
    const transaction = this.db.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  async addSave(save: SaveMeta): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVES, 'readwrite')
      const request = store.add(save)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('添加存档失败'))
    })
  }

  async updateSave(save: SaveMeta): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVES, 'readwrite')
      const request = store.put(save)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('更新存档失败'))
    })
  }

  async getSave(id: string): Promise<SaveMeta | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVES)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('获取存档失败'))
    })
  }

  async getAllSaves(): Promise<SaveMeta[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVES)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp))
      request.onerror = () => reject(new Error('获取存档列表失败'))
    })
  }

  async deleteSave(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVES, 'readwrite')
      const request = store.delete(id)
      request.onsuccess = () => {
        this.deleteSaveData(id).catch(console.error)
        this.deleteMemoriesBySaveId(id).catch(console.error)
        resolve()
      }
      request.onerror = () => reject(new Error('删除存档失败'))
    })
  }

  async saveSaveData(data: SaveData): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVE_DATA, 'readwrite')
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('保存存档数据失败'))
    })
  }

  async getSaveData(saveId: string): Promise<SaveData | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVE_DATA)
      const request = store.get(saveId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('获取存档数据失败'))
    })
  }

  async deleteSaveData(saveId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SAVE_DATA, 'readwrite')
      const request = store.delete(saveId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('删除存档数据失败'))
    })
  }

  async addMemory(memory: MemoryItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.MEMORIES, 'readwrite')
      const request = store.add(memory)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('添加记忆失败'))
    })
  }

  async addMemories(memories: MemoryItem[]): Promise<void> {
    const promises = memories.map(memory => this.addMemory(memory))
    await Promise.all(promises)
  }

  async getMemoriesBySaveId(saveId: string, limit?: number): Promise<MemoryItem[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.MEMORIES)
      const index = store.index('saveId')
      const request = index.getAll(saveId)
      request.onsuccess = () => {
        let result = request.result.sort((a, b) => b.timestamp - a.timestamp)
        if (limit) {
          result = result.slice(0, limit)
        }
        resolve(result)
      }
      request.onerror = () => reject(new Error('获取记忆失败'))
    })
  }

  async getMemoriesByImportance(saveId: string, minImportance: number, limit?: number): Promise<MemoryItem[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.MEMORIES)
      const saveIdIndex = store.index('saveId')
      const request = saveIdIndex.getAll(saveId)
      request.onsuccess = () => {
        let result = request.result
          .filter(m => m.importance >= minImportance)
          .sort((a, b) => b.timestamp - a.timestamp)
        if (limit) {
          result = result.slice(0, limit)
        }
        resolve(result)
      }
      request.onerror = () => reject(new Error('获取记忆失败'))
    })
  }

  async deleteMemoriesBySaveId(saveId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.MEMORIES, 'readwrite')
      const index = store.index('saveId')
      const request = index.openCursor(saveId)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(new Error('删除记忆失败'))
    })
  }

  async clearAll(): Promise<void> {
    const saves = await this.getAllSaves()
    for (const save of saves) {
      await this.deleteSave(save.id)
    }
  }
}

export const db = new Database()
