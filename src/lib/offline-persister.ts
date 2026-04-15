import { Persister } from '@tanstack/react-query-persist-client';
import { sqliteService } from '@/services/sqliteService';

/**
 * Cria um persister baseado em SQLite Nativo para o TanStack Query.
 * Esta é a solução mais robusta para APKs Android, pois os dados
 * persistem mesmo se o cache do browser for limpo.
 */
export const createSQLitePersister = (id = 'main'): Persister => {
  return {
    persistClient: async (client) => {
      try {
        console.log('[SQLitePersister] Persistindo client cache...');
        await sqliteService.setItem(`rq_cache_${id}`, client);
      } catch (error) {
        console.error('[SQLitePersister] Failed to persist client:', error);
      }
    },
    restoreClient: async () => {
      try {
        console.log('[SQLitePersister] Restaurando client cache do SQLite...');
        const cached = await sqliteService.getItem<any>(`rq_cache_${id}`);
        return cached || undefined;
      } catch (error) {
        console.error('[SQLitePersister] Failed to restore client:', error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await sqliteService.removeItem(`rq_cache_${id}`);
      } catch (error) {
        console.error('[SQLitePersister] Failed to remove client:', error);
      }
    },
  };
};

/**
 * Legado/Web Fallback:
 * No PC, continuamos usando a versão em memória/local temporária.
 */
export const createIDBPersister = createSQLitePersister; // Alias para manter compatibilidade simples
