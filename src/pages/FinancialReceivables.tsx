import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, isToday, isBefore, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { transactionService, Transaction, CreateTransactionData, TransactionStatus } from '@/services/transactionService';
import { clientService } from '@/services/clientService';
import { accountService } from '@/services/accountService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialHeader } from '@/components/financial/FinancialHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  PAGO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ATRASADO: 'bg-rose-100 text-rose-700 border-rose-200',
  CANCELADO: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDENTE: 'Em Aberto',
  PAGO: 'Recebido',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

export default function FinancialReceivables() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    search: '',
    accountId: 'all'
  });

  const [formData, setFormData] = useState<CreateTransactionData>({
    type: 'RECEITA',
    status: 'PENDENTE',
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    category: '',
    notes: '',
    account_id: undefined
  });

  // Queries
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'RECEITA', filters],
    queryFn: () => transactionService.getAll({
      type: 'RECEITA',
      startDate: filters.startDate.toISOString(),
      endDate: filters.endDate.toISOString(),
      account_id: filters.accountId
    }),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-active'],
    queryFn: accountService.getActive,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Receita criada com sucesso!');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) =>
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Receita atualizada!');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Removido com sucesso');
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: transactionService.markAsPaid,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        toast.success('Recebimento confirmado!');
    }
  });

  // Handlers
  const resetForm = useCallback(() => {
    setFormData({
      type: 'RECEITA',
      status: 'PENDENTE',
      description: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
      account_id: undefined
    });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  }, []);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      amount: transaction.amount,
      due_date: transaction.due_date,
      category: transaction.category || '',
      client_id: transaction.client_id || undefined,
      account_id: transaction.account_id || undefined,
      notes: transaction.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Calculations
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.description.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [transactions, filters.search]);

  const summary = useMemo(() => {
    const s = { vencidos: 0, hoje: 0, aVencer: 0, liquidados: 0, total: 0 };
    const today = new Date().toISOString().split('T')[0];

    filteredTransactions.forEach(t => {
        const amt = Number(t.amount);
        s.total += amt;
        if (t.status === 'PAGO') {
            s.liquidados += amt;
        } else {
            if (t.due_date < today) s.vencidos += amt;
            else if (t.due_date === today) s.hoje += amt;
            else s.aVencer += amt;
        }
    });
    return s;
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Contas a Receber</h1>
              <p className="text-muted-foreground">Gerencie suas faturas, vendas e recebimentos</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Plus className="h-4 w-4" /> Nova Receita
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingTransaction ? 'Editar Lançamento' : 'Novo Recebimento'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2 space-y-1.5">
                                <Label>Descrição / Resumo *</Label>
                                <Input 
                                    value={formData.description} 
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Ex: Venda de Kit Solar - Cliente João"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Valor (R$) *</Label>
                                <Input 
                                    type="number" step="0.01" 
                                    value={formData.amount} 
                                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Vencimento *</Label>
                                <Input 
                                    type="date"
                                    value={formData.due_date} 
                                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v: TransactionStatus) => setFormData({...formData, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDENTE">Em Aberto</SelectItem>
                                        <SelectItem value="PAGO">Recebido</SelectItem>
                                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Conta / Caixa</Label>
                                <Select value={formData.account_id} onValueChange={(v) => setFormData({...formData, account_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Categoria</Label>
                                <Input 
                                    value={formData.category} 
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    placeholder="Ex: Venda de Produtos"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cliente</Label>
                                <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Observações</Label>
                            <Textarea 
                                value={formData.notes} 
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows={2}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <FinancialHeader 
            type="RECEITA"
            filters={filters}
            onFilterChange={setFilters}
            summary={summary}
            selectedCount={selectedIds.length}
            onBatchAction={(action) => {
                if (action === 'markAsPaid') {
                    selectedIds.forEach(id => markAsPaidMutation.mutate(id));
                    setSelectedIds([]);
                }
                if (action === 'delete') {
                    if (confirm('Excluir selecionados?')) {
                        selectedIds.forEach(id => deleteMutation.mutate(id));
                        setSelectedIds([]);
                    }
                }
            }}
        />

        {/* Results Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="w-12 text-center">
                            <Checkbox 
                                checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0} 
                                onCheckedChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead className="text-xs uppercase font-bold text-muted-foreground">Vencimento</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-muted-foreground">Recebimento</TableHead>
                        <TableHead className="text-xs uppercase font-bold text-muted-foreground">Resumo do Lançamento</TableHead>
                        <TableHead className="text-right text-xs uppercase font-bold text-muted-foreground">Total (R$)</TableHead>
                        <TableHead className="text-right text-xs uppercase font-bold text-muted-foreground">A Receber (R$)</TableHead>
                        <TableHead className="text-center text-xs uppercase font-bold text-muted-foreground">Situação</TableHead>
                        <TableHead className="w-20"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-20 text-muted-foreground animate-pulse">Buscando lançamentos...</TableCell></TableRow>
                    ) : filteredTransactions.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-20 text-muted-foreground italic">Nenhum registro encontrado para este período.</TableCell></TableRow>
                    ) : (
                        filteredTransactions.map((t) => (
                            <TableRow key={t.id} className="hover:bg-muted/10 group transition-colors">
                                <TableCell className="text-center">
                                     <Checkbox 
                                        checked={selectedIds.includes(t.id)} 
                                        onCheckedChange={() => toggleSelect(t.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                    {format(parseISO(t.due_date), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {t.status === 'PAGO' && t.paid_date ? format(parseISO(t.paid_date), 'dd/MM/yyyy') : '-'}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-semibold text-sm">{t.description}</p>
                                        <div className="flex gap-2 mt-0.5">
                                            {t.category && <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded uppercase font-bold text-muted-foreground opacity-70">{t.category}</span>}
                                            {t.account_id && <span className="text-[10px] text-impulse-gold font-bold uppercase">{accounts.find(a => a.id === t.account_id)?.name}</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm">
                                    {formatCurrency(t.amount)}
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm text-emerald-600">
                                    {t.status === 'PAGO' ? '-' : formatCurrency(t.amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`font-bold px-3 py-1 ${STATUS_COLORS[t.status]}`}>
                                        {STATUS_LABELS[t.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onClick={() => handleEdit(t)} className="gap-2 cursor-pointer">
                                                <Edit className="h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => markAsPaidMutation.mutate(t.id)} className="gap-2 cursor-pointer text-emerald-600">
                                                <CheckCircle2 className="h-4 w-4" /> Baixar Recebimento
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteMutation.mutate(t.id)} className="gap-2 cursor-pointer text-rose-600">
                                                <Trash2 className="h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            
            {/* Table Footer / Summary */}
            <div className="bg-muted/20 p-4 border-t flex justify-between items-center text-sm">
                <div>
                    <span className="font-bold">Totais do período</span>
                    <p className="text-muted-foreground text-xs">{format(filters.startDate, 'dd/MM/yyyy')} a {format(filters.endDate, 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                     <span className="text-muted-foreground text-xs uppercase font-bold tracking-tighter block">Totais do período (R$)</span>
                     <span className="text-xl font-black text-foreground">{formatCurrency(summary.total)}</span>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
