import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';
import { transactionService, Transaction, CreateTransactionData, TransactionStatus } from '@/services/transactionService';
import { clientService } from '@/services/clientService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDENTE: 'bg-yellow-500',
  PAGO: 'bg-green-500',
  ATRASADO: 'bg-red-500',
  CANCELADO: 'bg-gray-500',
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Recebido',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

export default function FinancialReceivables() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<CreateTransactionData>({
    type: 'RECEITA',
    status: 'PENDENTE',
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    category: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'RECEITA', statusFilter],
    queryFn: () => transactionService.getAll({
      type: 'RECEITA',
      status: statusFilter !== 'all' ? statusFilter as TransactionStatus : undefined,
    }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Receita criada com sucesso!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar receita');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) =>
      transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Receita atualizada com sucesso!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar receita');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Receita excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir receita');
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: transactionService.markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-summary'] });
      toast.success('Receita marcada como recebida!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar como recebida');
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'RECEITA',
      status: 'PENDENTE',
      description: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
    });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

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
      notes: transaction.notes || '',
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalRecebido = transactions
    .filter(t => t.status === 'PAGO')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPendente = transactions
    .filter(t => t.status === 'PENDENTE' || t.status === 'ATRASADO')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAtrasado = transactions
    .filter(t => t.status === 'ATRASADO')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground">Gestão de entradas e faturamentos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2 bg-success hover:bg-success/90 text-white">
                <Plus className="h-4 w-4" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: TransactionStatus) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PAGO">Recebido</SelectItem>
                        <SelectItem value="ATRASADO">Atrasado</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Descrição *</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Vencimento *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: Venda, Assinatura"
                    />
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    <Select
                      value={formData.client_id || 'none'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === 'none' ? undefined : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" className="bg-success hover:bg-success/90 text-white">
                    {editingTransaction ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Indicators */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Total Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalRecebido)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totalPendente)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                Atrasado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalAtrasado)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar receita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Recebido</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma receita encontrada
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.category && (
                            <p className="text-sm text-muted-foreground">{transaction.category}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[transaction.status]}>
                          {STATUS_LABELS[transaction.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {transaction.status !== 'PAGO' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsPaidMutation.mutate(transaction.id)}
                              title="Marcar como recebido"
                            >
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(transaction.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
