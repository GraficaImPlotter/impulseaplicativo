import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Send, Paperclip, FileDown, AlertTriangle, MessageSquare, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';
import { ServiceOrder, ServiceOrderAttachmentSummary, ServiceOrderChecklistItem, serviceOrderService } from '@/services/serviceOrderService';
import { ServiceOrderLog, serviceOrderLogService } from '@/services/serviceOrderLogService';
import { clientService, Client } from '@/services/clientService';
import { serviceTypeService, ServiceType } from '@/services/serviceTypeService';

interface ServiceOrderModalProps {
  order: ServiceOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function ServiceOrderModal({ order, open, onOpenChange, onSave }: ServiceOrderModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [newLog, setNewLog] = useState('');
  
  // Data for selects using React Query for better caching and reliability
  const { data: clients = [] } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: clientService.getAll,
    enabled: open 
  });
  
  const { data: serviceTypes = [] } = useQuery({ 
    queryKey: ['service-types-active'], 
    queryFn: serviceTypeService.getActive,
    enabled: open 
  });

  const [formData, setFormData] = useState<Partial<ServiceOrder>>({
    client_id: '',
    service_type_id: '',
    execution_date: '',
    status: 'ABERTO',
    notes: '',
    assigned_to: '',
    checklist_state: []
  });

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
        execution_date: order.execution_date ? format(new Date(order.execution_date), 'yyyy-MM-dd') : ''
      });
      setActiveTab('details');
    } else {
      setFormData({
        client_id: '',
        service_type_id: '',
        execution_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'ABERTO',
        notes: '',
        assigned_to: '',
        checklist_state: []
      });
      setActiveTab('details');
    }
  }, [order, open]);

  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['service-order-logs', order?.id],
    queryFn: () => serviceOrderLogService.getByServiceOrderId(order!.id),
    enabled: open && !!order?.id
  });

  const handleSave = async () => {
    if (!formData.client_id || !formData.service_type_id) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o cliente e o tipo de serviço.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      if (order) {
        await serviceOrderService.update({
          ...formData,
          id: order.id
        });
        toast({ title: "Sucesso", description: "Ordem de serviço atualizada." });
      } else {
        await serviceOrderService.create(formData as any);
        toast({ title: "Sucesso", description: "Ordem de serviço criada." });
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a ordem de serviço.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!order || !newLog.trim()) return;

    try {
      await serviceOrderLogService.create({
        service_order_id: order.id,
        message: newLog,
        created_by: user?.id
      });
      setNewLog('');
      refetchLogs();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? 'Editar OS' : 'Nova Ordem de Serviço'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="logs" disabled={!order}>Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select 
                  value={formData.client_id || ''} 
                  onValueChange={(val) => setFormData({ ...formData, client_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Select 
                  value={formData.service_type_id || ''} 
                  onValueChange={(val) => setFormData({ ...formData, service_type_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Execução</Label>
                <Input 
                  type="date" 
                  value={formData.execution_date || ''} 
                  onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status || 'ABERTO'} 
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABERTO">Aberto</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={formData.notes || ''} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input 
                value={newLog} 
                onChange={(e) => setNewLog(e.target.value)}
                placeholder="Adicionar um comentário..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
              />
              <Button onClick={handleAddLog}>Enviar</Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="bg-muted p-3 rounded-lg space-y-1">
                    <p className="text-sm">{log.message}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
