import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { IS_NATIVE_APP } from '@/lib/platform';

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
let dbInstance: SQLiteDBConnection | null = null;

const DB_NAME = 'impulse_v1';

/**
 * SQLite Service
 * Gerencia o banco de dados nativo para persistência real no Android.
 */
export const sqliteService = {
  async init(): Promise<SQLiteDBConnection | null> {
    if (!IS_NATIVE_APP) return null;
    if (dbInstance) return dbInstance;

    try {
      console.log('[SQLite] Inicializando banco nativo...');
      
      // Criar/Abrir conexão
      const db = await sqliteConnection.createConnection(
        DB_NAME,
        false, // encrypted
        'no-encryption',
        1,
        false // readonly
      );

      await db.open();
      
      // Criar tabelas fundamentais
      // 1. KV Store (para cache do react-query e perfil do usuário)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Offline Queue (para mutações pendentes)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS offline_queue (
          id TEXT PRIMARY KEY,
          url TEXT,
          method TEXT,
          body TEXT,
          headers TEXT,
          retries INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      dbInstance = db;
      console.log('[SQLite] Banco de dados pronto.');
      return db;
    } catch (error) {
      console.error('[SQLite] Erro ao inicializar banco de dados:', error);
      return null;
    }
  },

  async setItem(key: string, value: any): Promise<void> {
    if (!dbInstance) {
      // Fallback para localStorage no Web ou se o DB falhar
      localStorage.setItem(`sqlite_fb_${key}`, JSON.stringify(value));
      return;
    }

    try {
      const stringValue = JSON.stringify(value);
      await dbInstance.run(
        'INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, stringValue]
      );
    } catch (error) {
      console.error(`[SQLite] Erro ao salvar chave ${key}:`, error);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    if (!dbInstance) {
      const val = localStorage.getItem(`sqlite_fb_${key}`);
      return val ? JSON.parse(val) : null;
    }

    try {
      const res = await dbInstance.query('SELECT value FROM kv_store WHERE key = ?', [key]);
      if (res.values && res.values.length > 0) {
        return JSON.parse(res.values[0].value) as T;
      }
      return null;
    } catch (error) {
      console.error(`[SQLite] Erro ao buscar chave ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!dbInstance) {
      localStorage.removeItem(`sqlite_fb_${key}`);
      return;
    }
    await dbInstance.run('DELETE FROM kv_store WHERE key = ?', [key]);
  },

  async clearCache(): Promise<void> {
    if (!dbInstance) return;
    await dbInstance.run('DELETE FROM kv_store');
  }
};
