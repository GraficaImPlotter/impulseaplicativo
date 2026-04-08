import { useEffect } from "react";
import { announcementService, SystemAnnouncement } from "@/services/announcementService";
import { toast } from "sonner";
import { RefreshCw, Megaphone, AlertTriangle, Info } from "lucide-react";
import { Button } from "../ui/button";

export function AnnouncementWatcher() {
  useEffect(() => {
    const unsubscribe = announcementService.subscribe((announcement: SystemAnnouncement) => {
      if (announcement.type === 'update') {
        toast.warning("Atualização do Sistema", {
          description: announcement.message,
          duration: Infinity,
          action: {
            label: "Atualizar Agora",
            onClick: () => window.location.reload()
          },
          icon: <RefreshCw className="h-4 w-4 animate-spin" />
        });
      } else if (announcement.type === 'warning') {
        toast.error("Alerta do Sistema", {
          description: announcement.message,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      } else {
        toast.info("Aviso", {
          description: announcement.message,
          icon: <Megaphone className="h-4 w-4" />
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return null; // This component has no UI on its own, it only listens and triggers toasts
}
