import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineSyncWatcher() {
  const { isOnline, isSyncing } = useOfflineSync();

  // Export custom events or state if needed globally, 
  // currently useOfflineSync holds its own state and displays its own toast notifications
  // It handles the singleton loops.
  
  return null;
}
