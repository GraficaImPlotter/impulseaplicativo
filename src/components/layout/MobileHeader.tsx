import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Bell, User } from "lucide-react";
import { useEffect, useState } from "react";
import logoImpulse from "@/assets/logo-impulse.png";

export function MobileHeader() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glassmorphism border-b border-white/10 z-50 px-4 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-2">
        <img src={logoImpulse} alt="Logo" className="h-8 object-contain" />
        <div className="h-4 w-px bg-white/20 mx-1" />
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">
            <Wifi className="h-3 w-3" />
            ONLINE
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold border border-amber-500/20 animate-pulse">
            <WifiOff className="h-3 w-3" />
            OFFLINE
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-white/70 hover:text-impulse-gold relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-impulse-gold rounded-full border border-impulse-dark" />
        </button>
        <div className="w-8 h-8 rounded-full bg-sidebar-accent border border-white/20 overflow-hidden flex items-center justify-center">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-white/50" />
          )}
        </div>
      </div>
    </header>
  );
}
