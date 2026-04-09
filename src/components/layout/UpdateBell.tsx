import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { updateService } from '@/services/updateService';
import { UpdateSheet } from './UpdateSheet';
import { cn } from '@/lib/utils';

export function UpdateBell({ className }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchUnread = async () => {
    try {
      const count = await updateService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnread();
    
    // Check for updates every 5 minutes
    const interval = setInterval(fetchUnread, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button 
        onClick={() => setSheetOpen(true)}
        className={cn(
          "p-2 text-white/70 hover:text-impulse-gold relative transition-all duration-300 hover:bg-white/5 rounded-xl group",
          className
        )}
      >
        <Bell className={cn("h-5 w-5 transition-transform group-hover:scale-110", unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-impulse-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-impulse-gold border border-impulse-dark"></span>
          </span>
        )}
      </button>

      <UpdateSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        onMarkedRead={fetchUnread}
      />
    </>
  );
}
