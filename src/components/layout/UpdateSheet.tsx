import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { updateService, SystemUpdate } from '@/services/updateService';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Bug, Zap, Megaphone, Calendar, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpdateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkedRead?: () => void;
}

const TYPE_CONFIG = {
  feature: {
    label: 'Nova Funcionalidade',
    icon: Sparkles,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  fix: {
    label: 'Correção',
    icon: Bug,
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
  improvement: {
    label: 'Melhoria',
    icon: Zap,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  notice: {
    label: 'Aviso',
    icon: Megaphone,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
};

export function UpdateSheet({ open, onOpenChange, onMarkedRead }: UpdateSheetProps) {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await updateService.getUpdates();
      setUpdates(data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchUpdates();
      // Auto mark all as read when opening
      updateService.markAllAsRead().then(() => {
        if (onMarkedRead) onMarkedRead();
      });
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-impulse-gold/10 rounded-xl border border-impulse-gold/20">
              <Sparkles className="h-5 w-5 text-impulse-gold" />
            </div>
            <SheetTitle className="text-xl font-bold">Novidades do Sistema</SheetTitle>
          </div>
          <SheetDescription>
            Acompanhe as últimas evoluções e melhorias do Impulse.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Megaphone className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">Nenhuma novidade ainda</p>
                <p className="text-sm text-muted-foreground/60">Fique atento, novidades em breve!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {updates.map((update) => {
                const config = TYPE_CONFIG[update.type];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={update.id} 
                    className="relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-sm group transition-all hover:border-impulse-gold/30 hover:shadow-md"
                  >
                    {!update.is_read && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-impulse-gold rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline" className={`gap-1.5 py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(update.created_at), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-impulse-gold transition-colors">
                      {update.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {update.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-emerald-500" />
            Você está atualizado com a última versão.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
