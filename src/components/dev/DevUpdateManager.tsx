import { useState, useEffect } from 'react';
import { updateService, SystemUpdate, UpdateType } from '@/services/updateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Bug, Zap, Megaphone, Plus, Trash2, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_CONFIG = {
  feature: { label: 'Funcionalidade', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10' },
  fix: { label: 'Correção', icon: Bug, color: 'text-rose-500 bg-rose-500/10' },
  improvement: { label: 'Melhoria', icon: Zap, color: 'text-blue-500 bg-blue-500/10' },
  notice: { label: 'Aviso', icon: Megaphone, color: 'text-amber-500 bg-amber-500/10' },
};

export function DevUpdateManager() {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature' as UpdateType,
  });

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await updateService.getUpdates();
      setUpdates(data);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Erro ao carregar atualizações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      await updateService.createUpdate(formData.title, formData.description, formData.type);
      toast.success('Atualização postada com sucesso!');
      setFormData({ title: '', description: '', type: 'feature' });
      fetchUpdates();
    } catch (error) {
      console.error('Error creating update:', error);
      toast.error('Erro ao postar atualização');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta atualização?')) return;

    try {
      await updateService.deleteUpdate(id);
      toast.success('Atualização excluída');
      fetchUpdates();
    } catch (error) {
      console.error('Error deleting update:', error);
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border/50 bg-muted/30 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-impulse-gold" />
              Postar Nova Atualização
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Isso será visível imediatamente para todos os usuários.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Título da Novidade</Label>
              <Input 
                placeholder="Ex: Novo Módulo de Projetos" 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="bg-muted/30 border-border/50 focus:border-impulse-gold transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v: UpdateType) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="fix">Correção de Bug</SelectItem>
                  <SelectItem value="notice">Aviso Importante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Descrição (O que mudou?)</Label>
            <Textarea 
              placeholder="Descreva as mudanças detalhadamente..." 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px] bg-muted/30 border-border/50 focus:border-impulse-gold transition-all resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              className="gradient-impulse text-white font-bold gap-2 px-8 py-6 rounded-xl hover-lift active:scale-95 transition-all shadow-gold"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Publicar Atualização
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
           Histórico de Postagens
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-impulse-gold" />
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 border border-dashed rounded-2xl text-muted-foreground">
            Nenhuma atualização postada ainda.
          </div>
        ) : (
          <div className="grid gap-4">
            {updates.map(u => {
              const config = TYPE_CONFIG[u.type];
              const Icon = config.icon;
              return (
                <div key={u.id} className="bg-white dark:bg-slate-900 border border-border/50 p-5 rounded-2xl flex items-center justify-between group transition-all hover:border-impulse-gold/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold">{u.title}</h4>
                        <Badge variant="outline" className="text-[9px] h-4 uppercase">{config.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Postado em {format(parseISO(u.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(u.id)}
                    className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
