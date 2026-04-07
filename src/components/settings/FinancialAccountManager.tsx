import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { accountService, FinancialAccount, CreateAccountData } from '@/services/accountService';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export function FinancialAccountManager() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    type: 'CORRENTE',
    initial_balance: 0,
    active: true,
    color: '#000000'
  });

  const loadAccounts = useCallback(async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar contas financeiras',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleOpenDialog = (account?: FinancialAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type || 'CORRENTE',
        initial_balance: account.initial_balance || 0,
        active: account.active ?? true,
        color: account.color || '#000000'
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'CORRENTE',
        initial_balance: 0,
        active: true,
        color: '#000000'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: 'Aviso',
        description: 'O nome da conta é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, formData);
        toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso' });
      } else {
        await accountService.create(formData);
        toast({ title: 'Sucesso', description: 'Conta criada com sucesso' });
      }
      setIsDialogOpen(false);
      loadAccounts();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar conta',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    
    try {
      await accountService.delete(id);
      toast({ title: 'Sucesso', description: 'Conta excluída com sucesso' });
      loadAccounts();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir conta',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-impulse-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Contas e Caixas</h3>
          <p className="text-sm text-muted-foreground">Gerencie seus bancos e caixas para lançamentos financeiros</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Saldo Inicial</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <Landmark className="h-4 w-4 text-impulse-gold" />
                {account.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{account.type}</Badge>
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.initial_balance || 0)}
              </TableCell>
              <TableCell>
                <Badge className={account.active ? 'bg-success' : 'bg-muted'}>
                  {account.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(account)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhuma conta cadastrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Nome da Conta *</Label>
              <Input
                id="account-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Banco Itaú, Caixa Geral"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account-type">Tipo</Label>
                <select
                  id="account-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.type || 'CORRENTE'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="CORRENTE">Conta Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="CAIXA">Caixa Físico</option>
                  <option value="INVESTIMENTO">Investimento</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-balance">Saldo Inicial</Label>
                <Input
                  id="initial-balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance || 0}
                  onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="account-active"
                checked={formData.active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="account-active">Conta Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
