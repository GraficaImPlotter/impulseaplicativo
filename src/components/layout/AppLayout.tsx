import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { CommandPalette } from '../CommandPalette';
import { AnnouncementWatcher } from './AnnouncementWatcher';
import { PresenceTracker } from './PresenceTracker';
import { PwaHandler } from '../dev/PwaHandler';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background font-sans">
      <AppSidebar />
      <CommandPalette />
      <AnnouncementWatcher />
      <PresenceTracker />
      <PwaHandler />
      <main className="flex-1 overflow-x-hidden overflow-y-auto max-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
